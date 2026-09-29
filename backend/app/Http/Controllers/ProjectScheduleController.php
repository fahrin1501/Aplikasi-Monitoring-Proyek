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

            // 1. HITUNG GRAND TOTAL RAB SECARA GLOBAL DI BACKEND
            $grandTotalRAB = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->where('rab_items.is_subheader', false)
                ->sum('rab_items.total_harga');

            // 2. CARI ID PEKERJAAN YANG SUDAH ADA LAPORAN HARIANNYA (APPROVED)
            $reportedItemIds = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_reports.status', 'approved')
                ->pluck('daily_report_activities.rab_item_id')
                ->unique()
                ->toArray();

            // 3. FILTER RAB CATEGORIES & ITEMS (Hanya kirim yang ada laporannya)
            $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
            $rabItems = collect([]);
            if (!empty($reportedItemIds)) {
                $rabItems = DB::table('rab_items')->whereIn('id', $reportedItemIds)->get();
            }

            $rabData = [];
            foreach ($rabCategories as $cat) {
                $items = collect($rabItems)->where('rab_category_id', $cat->id)->values();
                // HANYA KIRIM DIVISI JIKA ADA ITEM TERLAPOR DI DALAMNYA
                if ($items->count() > 0) {
                    $rabData[] = [
                        'id' => $cat->id,
                        'nama_kategori' => $cat->nama_kategori,
                        'kode_divisi' => $cat->kode_divisi ?? null,
                        'items' => $items
                    ];
                }
            }

            // 4. AMBIL TARGET JADWAL MINGGUAN (Macro)
            $schedules = DB::table('project_schedules')
                ->join('rab_items', 'project_schedules.rab_item_id', '=', 'rab_items.id')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->select('project_schedules.minggu_ke', 'project_schedules.bulan', 'project_schedules.tanggal_awal', 'project_schedules.tanggal_akhir', 'project_schedules.target_kumulatif')
                ->distinct()
                ->get();

            // 5. AMBIL DATA AKTUAL UNTUK MATRIKS
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
                    'grand_total_rab' => (float) $grandTotalRAB, // DISISIPKAN KE FRONTEND
                    'rab_data' => $rabData, // SUDAH BERSIH DARI SAMPAH KOSONG
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

            $allRabItemIds = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->pluck('rab_items.id')
                ->toArray();

            if (empty($allRabItemIds)) {
                return response()->json(['status' => 'error', 'message' => 'Data RAB Kosong! Silakan input RAB terlebih dahulu.'], 400);
            }

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
