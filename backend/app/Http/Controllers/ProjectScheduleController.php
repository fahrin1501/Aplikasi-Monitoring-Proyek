<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use Throwable; 

class ProjectScheduleController extends Controller
{
    public function getSchedules($projectId)
    {
        try {
            $projectInfo = DB::table('projects')->where('id', $projectId)->first();
            $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
            $catIds = $rabCategories->pluck('id')->toArray();
            
            $rabItems = collect([]);
            if (!empty($catIds)) {
                $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $catIds)->get();
            }

            $rabData = [];
            foreach ($rabCategories as $cat) {
                $items = collect($rabItems)->where('rab_category_id', $cat->id)->values();
                $rabData[] = [
                    'id' => $cat->id,
                    'nama_kategori' => $cat->nama_kategori,
                    'kode_divisi' => $cat->kode_divisi ?? null,
                    'items' => $items
                ];
            }

            // Unik per minggu (karena target kumulatif sekarang global per minggu)
            $schedules = DB::table('project_schedules')
                ->join('rab_items', 'project_schedules.rab_item_id', '=', 'rab_items.id')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->select('project_schedules.minggu_ke', 'project_schedules.bulan', 'project_schedules.tanggal_awal', 'project_schedules.tanggal_akhir', 'project_schedules.target_kumulatif')
                ->distinct()
                ->get();

            $rawRealizations = collect([]);
            $matrix_actual = [];
            $weekly_actual = [];
            $cumulative_actual = [];

            try {
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
            } catch (Throwable $th) {}

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
            return response()->json([
                'status' => 'error',
                'message' => 'Backend Crash: ' . $e->getMessage() . ' | Line: ' . $e->getLine()
            ], 500);
        }
    }

    public function saveSchedules(Request $request, $projectId)
    {
        try {
            DB::beginTransaction();

            $isFullSync = $request->input('full_sync', false);
            $weeks = $request->input('weeks', []);

            // Tarik seluruh ID RAB Proyek Ini
            $allRabItemIds = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->pluck('rab_items.id')
                ->toArray();

            if (empty($allRabItemIds)) {
                return response()->json(['status' => 'error', 'message' => 'Data RAB Kosong! Silakan input RAB terlebih dahulu.'], 400);
            }

            // Penghapusan data lama sesuai mode
            if ($isFullSync) {
                DB::table('project_schedules')->whereIn('rab_item_id', $allRabItemIds)->delete();
            } else {
                foreach ($weeks as $week) {
                    DB::table('project_schedules')
                        ->whereIn('rab_item_id', $allRabItemIds)
                        ->where('minggu_ke', $week['minggu_ke'])
                        ->delete();
                }
            }

            $insertData = [];
            $now = now();

            foreach ($weeks as $week) {
                $targetKumulatif = (float) ($week['target_kumulatif'] ?? 0);
                $bobotPerItem = count($allRabItemIds) > 0 ? ($targetKumulatif / count($allRabItemIds)) : 0;

                // Masukkan seluruh item RAB secara massal ke minggu tersebut
                foreach ($allRabItemIds as $itemId) {
                    $insertData[] = [
                        'project_id' => $projectId, 
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

            if (!empty($insertData)) {
                // Di-chunk agar MySQL tidak menolak query yang terlalu besar
                foreach (array_chunk($insertData, 500) as $chunk) {
                    DB::table('project_schedules')->insert($chunk);
                }
            }

            $project = Project::find($projectId);
            if ($project && $project->status === 'Perencanaan') {
                $project->update(['status' => 'Persiapan']);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Target Jadwal Matriks berhasil disimpan!']);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function destroySchedules($projectId)
    {
        try {
            DB::beginTransaction();

            $rabItemIds = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->pluck('rab_items.id')
                ->toArray();

            if (!empty($rabItemIds)) {
                DB::table('project_schedules')->whereIn('rab_item_id', $rabItemIds)->delete();
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 500);
        }
    }
}