<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use Throwable;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\KurvaExport;
use App\Services\ProjectProgressService; //[cite: 13]

class ProjectScheduleController extends Controller
{
    private $progressService;

    public function __construct(ProjectProgressService $progressService)
    {
        $this->progressService = $progressService; //[cite: 13]
    }

    public function getSchedules($projectId)
    {
        try {
            $projectInfo = DB::table('projects')->where('id', $projectId)->first(); //[cite: 13]

            // 1. Ambil Grand Total RAB dari Service
            $grandTotalRAB = $this->progressService->calculateTotalProjectValue($projectId); //[cite: 13]

            // 2. Ambil Seluruh Kategori & Item RAB
            $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get(); //[cite: 13]
            $categoryIds = $rabCategories->pluck('id')->toArray(); //[cite: 13]

            $rabItems = collect([]); //[cite: 13]
            if (!empty($categoryIds)) {
                $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $categoryIds)->get(); //[cite: 13]
            }

            $rabData = []; //[cite: 13]
            foreach ($rabCategories as $cat) { //[cite: 13]
                $items = collect($rabItems)->where('rab_category_id', $cat->id)->values(); //[cite: 13]
                if ($items->count() > 0) { //[cite: 13]
                    $rabData[] = [ //[cite: 13]
                        'id' => $cat->id, //[cite: 13]
                        'nama_kategori' => $cat->nama_kategori, //[cite: 13]
                        'kode_divisi' => $cat->kode_divisi ?? null, //[cite: 13]
                        'items' => $items //[cite: 13]
                    ];
                }
            }

            // 3. Ambil Jadwal Mingguan
            $schedules = DB::table('project_schedules') //[cite: 13]
                ->where('project_id', $projectId) //[cite: 13]
                ->orderBy('minggu_ke', 'asc') //[cite: 13]
                ->get(); //[cite: 13]

            // 4. Data Aktual & Realisasi Harian
            $rawRealizations = collect([]); //[cite: 13]
            $matrix_actual = []; //[cite: 13]
            $weekly_actual = []; //[cite: 13]
            $cumulative_actual = []; //[cite: 13]

            try {
                $rawRealizations = DB::table('daily_report_activities') //[cite: 13]
                    ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id') //[cite: 13]
                    ->where('daily_reports.project_id', $projectId) //[cite: 13]
                    ->where('daily_reports.status', 'approved') //[cite: 13]
                    ->select( //[cite: 13]
                        'daily_reports.id as report_id', //[cite: 13]
                        'daily_report_activities.id as activity_id', //[cite: 13]
                        'daily_report_activities.uraian as uraian_laporan', //[cite: 13]
                        'daily_report_activities.rab_item_id', //[cite: 13]
                        'daily_reports.minggu_ke', //[cite: 13]
                        'daily_reports.tanggal as tgl_input', //[cite: 13]
                        'daily_report_activities.volume as volume_laporan', //[cite: 13]
                        'daily_report_activities.persentase as bobot_realisasi', //[cite: 13]
                        'daily_reports.status as status_laporan' //[cite: 13]
                    )
                    ->get(); //[cite: 13]

                $aggregatedActuals = DB::table('daily_report_activities') //[cite: 13]
                    ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id') //[cite: 13]
                    ->where('daily_reports.project_id', $projectId) //[cite: 13]
                    ->where('daily_reports.status', 'approved') //[cite: 13]
                    ->select( //[cite: 13]
                        'daily_report_activities.rab_item_id', //[cite: 13]
                        'daily_reports.minggu_ke', //[cite: 13]
                        DB::raw('SUM(daily_report_activities.persentase) as total_persen') //[cite: 13]
                    )
                    ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke') //[cite: 13]
                    ->having('total_persen', '>', 0) //[cite: 13]
                    ->get(); //[cite: 13]

                foreach ($aggregatedActuals as $r) { //[cite: 13]
                    $itemId = $r->rab_item_id ?? 'manual'; //[cite: 13]
                    $minggu = $r->minggu_ke ?? 0; //[cite: 13]
                    $persen = (float) $r->total_persen; //[cite: 13]

                    if (!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = []; //[cite: 13]
                    $matrix_actual[$itemId][$minggu] = $persen; //[cite: 13]

                    if (!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0; //[cite: 13]
                    $weekly_actual[$minggu] += $persen; //[cite: 13]

                    if (!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0; //[cite: 13]
                    $cumulative_actual[$itemId] += $persen; //[cite: 13]
                }
            } catch (Throwable $th) {} //[cite: 13]

            return response()->json([ //[cite: 13]
                'status' => 'success', //[cite: 13]
                'data' => [ //[cite: 13]
                    'project_info' => $projectInfo, //[cite: 13]
                    'grand_total_rab' => (float) $grandTotalRAB, //[cite: 13]
                    'rab_data' => $rabData, //[cite: 13]
                    'schedules' => $schedules, //[cite: 13]
                    'matrix_actual' => $matrix_actual, //[cite: 13]
                    'weekly_actual' => $weekly_actual, //[cite: 13]
                    'cumulative_actual' => $cumulative_actual, //[cite: 13]
                    'realizations' => $rawRealizations //[cite: 13]
                ]
            ]);
        } catch (Throwable $e) { //[cite: 13]
            return response()->json([ //[cite: 13]
                'status' => 'error', //[cite: 13]
                'message' => 'Backend Crash: ' . $e->getMessage() . ' | Line: ' . $e->getLine() //[cite: 13]
            ], 500); //[cite: 13]
        }
    }

    public function saveSchedules(Request $request, $projectId) //[cite: 13]
    {
        try {
            DB::beginTransaction(); //[cite: 13]

            $isFullSync = $request->input('full_sync', false); //[cite: 13]
            $weeks = $request->input('weeks', []); //[cite: 13]

            if ($isFullSync) { //[cite: 13]
                DB::table('project_schedules')->where('project_id', $projectId)->delete(); //[cite: 13]
            } else {
                foreach ($weeks as $week) { //[cite: 13]
                    DB::table('project_schedules') //[cite: 13]
                        ->where('project_id', $projectId) //[cite: 13]
                        ->where('minggu_ke', $week['minggu_ke']) //[cite: 13]
                        ->delete(); //[cite: 13]
                }
            }

            $insertData = []; //[cite: 13]
            $now = now(); //[cite: 13]

            foreach ($weeks as $week) { //[cite: 13]
                $insertData[] = [ //[cite: 13]
                    'project_id' => $projectId, //[cite: 13]
                    'minggu_ke' => $week['minggu_ke'], //[cite: 13]
                    'bulan' => $week['bulan'] ?? null, //[cite: 13]
                    'tanggal_awal' => $week['tanggal_awal'] ?? null, //[cite: 13]
                    'tanggal_akhir' => $week['tanggal_akhir'] ?? null, //[cite: 13]
                    'target_kumulatif' => (float) ($week['target_kumulatif'] ?? 0), //[cite: 13]
                    'created_at' => $now, //[cite: 13]
                    'updated_at' => $now, //[cite: 13]
                ];
            }

            if (!empty($insertData)) { //[cite: 13]
                DB::table('project_schedules')->insert($insertData); //[cite: 13]
            }

            $project = Project::find($projectId); //[cite: 13]
            if ($project && $project->status === 'Perencanaan') { //[cite: 13]
                $project->update(['status' => 'Persiapan']); //[cite: 13]
            }

            DB::commit(); //[cite: 13]
            return response()->json(['status' => 'success', 'message' => 'Jadwal Mingguan (Plan) berhasil disimpan!']); //[cite: 13]
        } catch (Throwable $e) { //[cite: 13]
            DB::rollBack(); //[cite: 13]
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500); //[cite: 13]
        }
    }

    public function destroySchedules($projectId) //[cite: 13]
    {
        try {
            DB::beginTransaction(); //[cite: 13]
            DB::table('project_schedules')->where('project_id', $projectId)->delete(); //[cite: 13]
            DB::commit(); //[cite: 13]
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']); //[cite: 13]
        } catch (Throwable $e) { //[cite: 13]
            DB::rollBack(); //[cite: 13]
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 500); //[cite: 13]
        }
    }

    private function prepareExportData($projectId, $request) //[cite: 13]
    {
        $projectInfo = DB::table('projects')->where('id', $projectId)->first(); //[cite: 13]
        $grandTotalRAB = $this->progressService->calculateTotalProjectValue($projectId); //[cite: 13]

        $schedules = DB::table('project_schedules') //[cite: 13]
            ->where('project_id', $projectId) //[cite: 13]
            ->orderBy('minggu_ke', 'asc') //[cite: 13]
            ->get(); //[cite: 13]

        $matrix_actual = []; //[cite: 13]
        $weekly_actual = []; //[cite: 13]
        $cumulative_actual = []; //[cite: 13]
        $reportedItemIds = []; //[cite: 13]
        $hasManual = false; //[cite: 13]

        try {
            $aggregatedActuals = DB::table('daily_report_activities') //[cite: 13]
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id') //[cite: 13]
                ->where('daily_reports.project_id', $projectId) //[cite: 13]
                ->where('daily_reports.status', 'approved') //[cite: 13]
                ->select( //[cite: 13]
                    'daily_report_activities.rab_item_id', //[cite: 13]
                    'daily_reports.minggu_ke', //[cite: 13]
                    DB::raw('SUM(daily_report_activities.persentase) as total_persen') //[cite: 13]
                )
                ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke') //[cite: 13]
                ->having('total_persen', '>', 0) //[cite: 13]
                ->get(); //[cite: 13]

            foreach ($aggregatedActuals as $r) { //[cite: 13]
                $itemId = $r->rab_item_id ?? 'manual'; //[cite: 13]
                $minggu = $r->minggu_ke ?? 0; //[cite: 13]
                $persen = (float) $r->total_persen; //[cite: 13]

                if ($r->rab_item_id) { //[cite: 13]
                    $reportedItemIds[] = $r->rab_item_id; //[cite: 13]
                } else {
                    $hasManual = true; //[cite: 13]
                }

                if (!isset($matrix_actual[$itemId])) $matrix_actual[$itemId] = []; //[cite: 13]
                $matrix_actual[$itemId][$minggu] = $persen; //[cite: 13]

                if (!isset($weekly_actual[$minggu])) $weekly_actual[$minggu] = 0; //[cite: 13]
                $weekly_actual[$minggu] += $persen; //[cite: 13]

                if (!isset($cumulative_actual[$itemId])) $cumulative_actual[$itemId] = 0; //[cite: 13]
                $cumulative_actual[$itemId] += $persen; //[cite: 13]
            }
            $reportedItemIds = array_unique($reportedItemIds); //[cite: 13]
        } catch (Throwable $th) {} //[cite: 13]

        $rabData = []; //[cite: 13]
        if (!empty($reportedItemIds)) { //[cite: 13]
            $rabCategories = DB::table('rab_categories') //[cite: 13]
                ->where('project_id', $projectId) //[cite: 13]
                ->whereIn('id', function ($query) use ($reportedItemIds) { //[cite: 13]
                    $query->select('rab_category_id')->from('rab_items')->whereIn('id', $reportedItemIds); //[cite: 13]
                })->get(); //[cite: 13]

            $rabItems = DB::table('rab_items')->whereIn('id', $reportedItemIds)->get(); //[cite: 13]

            foreach ($rabCategories as $cat) { //[cite: 13]
                // Kalkulasi bobot (%) otomatis per baris item
                $items = collect($rabItems)->where('rab_category_id', $cat->id)->map(function ($item) use ($grandTotalRAB) {
                    $bobot = ($grandTotalRAB > 0 && !$item->is_subheader)
                        ? ($item->total_harga / $grandTotalRAB) * 100
                        : 0;
                    $item->bobot = round($bobot, 2);
                    return $item;
                })->values();

                if ($items->count() > 0) { //[cite: 13]
                    $rabData[] = [ //[cite: 13]
                        'id' => $cat->id, //[cite: 13]
                        'nama_kategori' => $cat->nama_kategori, //[cite: 13]
                        'kode_divisi' => $cat->kode_divisi ?? null, //[cite: 13]
                        'items' => $items //[cite: 13]
                    ];
                }
            }
        }

        if ($hasManual) { //[cite: 13]
            $rabData[] = [ //[cite: 13]
                'id' => 'cat-manual', //[cite: 13]
                'nama_kategori' => 'PEKERJAAN TAMBAHAN (DI LUAR JADWAL/RAB)', //[cite: 13]
                'kode_divisi' => 'EXT', //[cite: 13]
                'items' => collect([(object)[ //[cite: 13]
                    'id' => 'manual', //[cite: 13]
                    'kode_pekerjaan' => '-', //[cite: 13]
                    'uraian_pekerjaan' => 'Pekerjaan Input Manual', //[cite: 13]
                    'is_manual' => true, //[cite: 13]
                    'bobot' => 0,
                    'total_harga' => 0 //[cite: 13]
                ]])
            ];
        }

        return [ //[cite: 13]
            'project' => $projectInfo, //[cite: 13]
            'rabData' => $rabData, //[cite: 13]
            'localWeeks' => $schedules, //[cite: 13]
            'matrix_actual' => $matrix_actual, //[cite: 13]
            'weekly_actual' => $weekly_actual, //[cite: 13]
            'cumulative_actual' => $cumulative_actual, //[cite: 13]
            'grandTotalRAB' => $grandTotalRAB, //[cite: 13]
            'startDate' => $request->start_date, //[cite: 13]
            'endDate' => $request->end_date, //[cite: 13]
            'viewMode' => $request->view_mode //[cite: 13]
        ];
    }

    public function exportKurvaPdf(Request $request, $projectId) //[cite: 13]
    {
        $exportData = $this->prepareExportData($projectId, $request); //[cite: 13]
        $exportData['chartImageBase64'] = $request->chart_image ?? null; //[cite: 13]

        $pdf = Pdf::loadView('exports.kurva-s', $exportData)->setPaper('a4', 'landscape'); //[cite: 13]
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $exportData['project']->nama_proyek ?? 'Proyek'); //[cite: 13]
        return $pdf->download("KurvaS_Matriks_{$safeName}.pdf"); //[cite: 13]
    }

    public function exportKurvaExcel(Request $request, $projectId)
    {
        try {
            $exportData = $this->prepareExportData($projectId, $request);
            $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $exportData['project']->nama_proyek ?? 'Proyek');

            // Langsung ekspor tabel data murni tanpa gambar
            $export = new KurvaExport($exportData);
            return Excel::download($export, "KurvaS_Matriks_{$safeName}.xlsx");
        } catch (Throwable $e) {
            \Log::error("Gagal Export Excel: " . $e->getMessage() . " di " . $e->getFile() . ":" . $e->getLine());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export Excel: ' . $e->getMessage() . ' di baris ' . $e->getLine()
            ], 500);
        }
    }
}
