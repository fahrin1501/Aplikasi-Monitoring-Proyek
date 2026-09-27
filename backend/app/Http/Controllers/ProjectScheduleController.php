<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use Throwable; // Import fungsi penangkap crash mutlak PHP

class ProjectScheduleController extends Controller
{
    public function getSchedules($projectId)
    {
        try {
            // 1. Ambil Data Project & RAB secara aman
            $projectInfo = DB::table('projects')->where('id', $projectId)->first();

            $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
            $catIds = $rabCategories->pluck('id')->toArray();

            $rabData = [];
            if (!empty($catIds)) {
                $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $catIds)->get();
                foreach ($rabCategories as $cat) {
                    $items = collect($rabItems)->where('rab_category_id', $cat->id)->values();
                    $rabData[] = [
                        'id' => $cat->id,
                        'nama_kategori' => $cat->nama_kategori,
                        'kode_divisi' => $cat->kode_divisi ?? null,
                        'items' => $items
                    ];
                }
            }

            // 2. Ambil Schedule Plan (Target Jadwal) dengan filter aman
            $schedules = [];
            if (!empty($catIds)) {
                $schedules = DB::table('schedules')
                    ->join('rab_items', 'schedules.rab_item_id', '=', 'rab_items.id')
                    ->whereIn('rab_items.rab_category_id', $catIds)
                    ->select('schedules.*')
                    ->get();
            }

            // 3. AMBIL DATA MENTAH UNTUK MODAL POP-UP (H1-H7)
            $rawRealizations = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_reports.status', 'approved')
                ->select(
                    'daily_report_activities.rab_item_id',
                    'daily_reports.minggu_ke',
                    'daily_reports.tanggal as tgl_input',
                    'daily_report_activities.volume as volume_laporan',
                    'daily_report_activities.persentase as bobot_realisasi',
                    'daily_reports.status as status_laporan'
                )
                ->get();

            // 4. OPTIMASI BACKEND: Hitung agregasi
            $aggregatedActuals = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_reports.status', 'approved')
                ->select(
                    'daily_report_activities.rab_item_id',
                    'daily_reports.minggu_ke',
                    DB::raw('SUM(daily_report_activities.persentase) as total_persen')
                )
                ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke')
                ->get();

            // 5. BENTUK KAMUS DATA (DICTIONARY O(1))
            $matrix_actual = [];
            $weekly_actual = [];
            $cumulative_actual = [];

            foreach($aggregatedActuals as $r) {
                $itemId = $r->rab_item_id ?? 'manual';
                $minggu = $r->minggu_ke ?? 0;
                $persen = (float) $r->total_persen;

                if(!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = [];
                $matrix_actual[$itemId][$minggu] = $persen;

                if(!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0;
                $weekly_actual[$minggu] += $persen;

                if(!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0;
                $cumulative_actual[$itemId] += $persen;
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'project_info' => $projectInfo,
                    'rab_data' => $rabData,
                    'schedules' => $schedules,
                    'matrix_actual' => $matrix_actual,
                    'weekly_actual' => $weekly_actual,
                    'cumulative_actual' => $cumulative_actual,
                    'realizations' => $rawRealizations
                ]
            ]);

        } catch (Throwable $e) {
            // Kita ubah response menjadi 400 agar hosting/Railway tidak menyembunyikan pesannya!
            return response()->json([
                'status' => 'error',
                'message' => 'Backend Error: ' . $e->getMessage() . ' | Baris: ' . $e->getLine()
            ], 400);
        }
    }

    public function saveSchedules(Request $request, $projectId)
    {
        try {
            DB::beginTransaction();

            $isFullSync = $request->input('full_sync', false);
            $weeks = $request->input('weeks', []);

            if ($isFullSync) {
                $rabItemIds = DB::table('rab_items')
                    ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                    ->where('rab_categories.project_id', $projectId)
                    ->pluck('rab_items.id')->toArray();

                if (!empty($rabItemIds)) {
                    DB::table('schedules')->whereIn('rab_item_id', $rabItemIds)->delete();
                }
            } else {
                foreach ($weeks as $week) {
                    $rabItemIds = DB::table('rab_items')
                        ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                        ->where('rab_categories.project_id', $projectId)
                        ->pluck('rab_items.id')->toArray();

                    if (!empty($rabItemIds)) {
                        DB::table('schedules')
                            ->whereIn('rab_item_id', $rabItemIds)
                            ->where('minggu_ke', $week['minggu_ke'])
                            ->delete();
                    }
                }
            }

            $insertData = [];
            $now = now();

            foreach ($weeks as $week) {
                $itemIds = $week['rab_item_ids'] ?? [];
                if (empty($itemIds)) continue;

                $targetKumulatif = (float) ($week['target_kumulatif'] ?? 0);
                $bobotPerItem = count($itemIds) > 0 ? ($targetKumulatif / count($itemIds)) : 0;

                foreach ($itemIds as $itemId) {
                    $insertData[] = [
                        'rab_item_id' => $itemId,
                        'minggu_ke' => $week['minggu_ke'],
                        'bulan' => $week['bulan'] ?? null,
                        'tanggal_awal' => $week['tanggal_awal'] ?? null,
                        'tanggal_akhir' => $week['tanggal_akhir'] ?? null,
                        'target_kumulatif' => $targetKumulatif,
                        'bobot_rencana' => $bobotPerItem,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if (!empty($insertData)) DB::table('schedules')->insert($insertData);

            $project = Project::find($projectId);
            if ($project && $project->status === 'Perencanaan') {
                $project->update(['status' => 'Persiapan']);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Target Jadwal Matriks berhasil disimpan!']);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 400);
        }
    }

    public function destroySchedules($projectId)
    {
        try {
            DB::beginTransaction();

            $rabItemIds = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->pluck('rab_items.id')->toArray();

            if (!empty($rabItemIds)) {
                DB::table('schedules')->whereIn('rab_item_id', $rabItemIds)->delete();
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 400);
        }
    }
}
