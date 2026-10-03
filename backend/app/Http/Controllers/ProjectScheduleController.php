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

            $grandTotalRAB = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->where('rab_items.is_subheader', false)
                ->sum('rab_items.total_harga');

            $schedules = DB::table('project_schedules')
                ->where('project_id', $projectId)
                ->orderBy('minggu_ke', 'asc')
                ->get();

            $rawRealizations = collect([]);
            $matrix_actual = [];
            $weekly_actual = [];
            $cumulative_actual = [];

            $reportedItemIds = [];
            $hasManual = false;

            try {
                // PERBAIKAN: Menambahkan 'daily_reports.id as report_id' agar Frontend bisa membuka link edit
                $rawRealizations = DB::table('daily_report_activities')
                    ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                    ->where('daily_reports.project_id', $projectId)
                    ->where('daily_reports.status', 'approved')
                    ->select(
                        'daily_reports.id as report_id',
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
                    ->having('total_persen', '>', 0)
                    ->get();

                foreach($aggregatedActuals as $r) {
                    $itemId = $r->rab_item_id ?? 'manual';
                    $minggu = $r->minggu_ke ?? 0;
                    $persen = (float) $r->total_persen;

                    if ($r->rab_item_id) {
                        $reportedItemIds[] = $r->rab_item_id;
                    } else {
                        $hasManual = true;
                    }

                    if(!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = [];
                    $matrix_actual[$itemId][$minggu] = $persen;

                    if(!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0;
                    $weekly_actual[$minggu] += $persen;

                    if(!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0;
                    $cumulative_actual[$itemId] += $persen;
                }

                $reportedItemIds = array_unique($reportedItemIds);

            } catch (Throwable $th) {}

            $rabData = [];
            if (!empty($reportedItemIds)) {
                $rabCategories = DB::table('rab_categories')
                    ->where('project_id', $projectId)
                    ->whereIn('id', function($query) use ($reportedItemIds) {
                        $query->select('rab_category_id')->from('rab_items')->whereIn('id', $reportedItemIds);
                    })->get();

                $rabItems = DB::table('rab_items')->whereIn('id', $reportedItemIds)->get();

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
            }

            if ($hasManual) {
                $rabData[] = [
                    'id' => 'cat-manual',
                    'nama_kategori' => 'PEKERJAAN TAMBAHAN (DI LUAR JADWAL/RAB)',
                    'kode_divisi' => 'EXT',
                    'items' => [[
                        'id' => 'manual',
                        'kode_pekerjaan' => '-',
                        'uraian_pekerjaan' => 'Pekerjaan Input Manual',
                        'is_manual' => true,
                        'total_harga' => 0
                    ]]
                ];
            }

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
