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

            // 1. HITUNG GRAND TOTAL RAB
            $grandTotalRAB = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->where('rab_items.is_subheader', false)
                ->sum('rab_items.total_harga');

            $reportedItemIds = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->where('daily_reports.project_id', $projectId)
                ->where('daily_reports.status', 'approved')
                ->pluck('daily_report_activities.rab_item_id')
                ->unique()
                ->toArray();

            $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
            $rabItems = collect([]);
            if (!empty($reportedItemIds)) {
                $rabItems = DB::table('rab_items')->whereIn('id', $reportedItemIds)->get();
            }

            $rabData = [];
            foreach ($rabCategories as $cat) {
                $items = collect($rabItems)->where('rab_category_id', $cat->id)->values();
                if ($items->count() > 0) {
                    $rabData[] = [
                        'id' => $cat->id,
                        'nama_kategori' => $cat->nama_kategori,
                        'kode_divisi' => $cat->kode_divisi ?? null,
                        'items' => $items
                    ];
                }
            }

            // 2. TARIK DATA SCHEDULE (SEKARANG SANGAT CEPAT DAN KECIL)
            $schedules = DB::table('project_schedules')
                ->where('project_id', $projectId)
                ->orderBy('minggu_ke', 'asc')
                ->get();

            // 3. AMBIL DATA AKTUAL (Realisasi)
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
                    'grand_total_rab' => (float) $grandTotalRAB,
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

            // 1. CLEAR DATABASE (Lebih cepat karena tidak terikat RAB)
            if ($isFullSync) {
                DB::table('project_schedules')->where('project_id', $projectId)->delete();
            } else {
                foreach ($weeks as $week) {
                    DB::table('project_schedules')
                        ->where('project_id', $projectId)
                        ->where('minggu_ke', $week['minggu_ke'])
                        ->delete();
                }
            }

            $insertData = [];
            $now = now();

            // 2. SIMPAN SECARA MAKRO (Super Kilat: Hanya 1 baris per minggu!)
            foreach ($weeks as $week) {
                $insertData[] = [
                    'project_id' => $projectId,
                    'minggu_ke' => $week['minggu_ke'],
                    'bulan' => $week['bulan'] ?? null,
                    'tanggal_awal' => $week['tanggal_awal'] ?? null,
                    'tanggal_akhir' => $week['tanggal_akhir'] ?? null,
                    'target_kumulatif' => (float) ($week['target_kumulatif'] ?? 0),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($insertData)) {
                DB::table('project_schedules')->insert($insertData);
            }

            $project = Project::find($projectId);
            if ($project && $project->status === 'Perencanaan') {
                $project->update(['status' => 'Persiapan']);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Jadwal Mingguan (Plan) berhasil disimpan!']);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function destroySchedules($projectId)
    {
        try {
            DB::beginTransaction();
            DB::table('project_schedules')->where('project_id', $projectId)->delete();
            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 500);
        }
    }
}
