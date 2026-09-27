<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\RabCategory;
use App\Models\ProjectSchedule;
use App\Models\DailyReport;
use App\Models\RabItem;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\KurvaExport;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProjectScheduleController extends Controller
{
    /**
     * Menarik Data Jadwal Rencana & Data Realisasi Laporan Harian untuk S-Curve & Jadwal Data
     */
    public function getSchedules($projectId)
    {
        $project = Project::findOrFail($projectId);

        $totalHari = 0;
        $totalMinggu = 0;

       $rawRealizations = \Illuminate\Support\Facades\DB::table('daily_report_activities')
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

        // 2. OPTIMASI BACKEND: Hitung agregasi langsung menggunakan Query SQL (Sangat Cepat)
        $aggregatedActuals = \Illuminate\Support\Facades\DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->select(
                'daily_report_activities.rab_item_id',
                'daily_reports.minggu_ke',
                \Illuminate\Support\Facades\DB::raw('SUM(daily_report_activities.persentase) as total_persen')
            )
            ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke')
            ->get();

        // 3. SUSUN MENJADI DICTIONARY AGAR REACT TIDAK NGE-LAG
        $matrix_actual = [];
        $weekly_actual = [];
        $cumulative_actual = [];

        foreach($aggregatedActuals as $r) {
            // Untuk isi sel matriks [itemId][minggu]
            $matrix_actual[$r->rab_item_id][$r->minggu_ke] = (float) $r->total_persen;

            // Untuk total aktual per minggu (Footer Bawah)
            if(!isset($weekly_actual[$r->minggu_ke])) $weekly_actual[$r->minggu_ke] = 0;
            $weekly_actual[$r->minggu_ke] += (float) $r->total_persen;

            // Untuk kumulatif per pekerjaan (Kolom Ujung Kanan)
            if(!isset($cumulative_actual[$r->rab_item_id])) $cumulative_actual[$r->rab_item_id] = 0;
            $cumulative_actual[$r->rab_item_id] += (float) $r->total_persen;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'project_info' => $projectInfo ?? null,
                'rab_data' => $rabData ?? [],
                'schedules' => $schedules ?? [],

                // --- PAYLOAD OPTIMASI BARU UNTUK FRONTEND ---
                'matrix_actual' => $matrix_actual,
                'weekly_actual' => $weekly_actual,
                'cumulative_actual' => $cumulative_actual,
                'realizations' => $rawRealizations // (Hanya dipakai saat modal pop-up diklik)
            ]
        ]);
    }

    /**
     * Menyimpan Data Jadwal (Struktur MVC Baru: Weekly Based + Kumulatif)
     */
    public function saveSchedules(Request $request, $projectId)
    {
        $request->validate([
            'weeks' => 'required|array'
        ]);

        DB::beginTransaction();
        try {
            $isFullSync = $request->input('full_sync', false);

            if ($isFullSync) {
                ProjectSchedule::where('project_id', $projectId)->delete();
            }

            $insertData = [];
            $now = now();

            foreach ($request->weeks as $week) {
                $mingguKe = $week['minggu_ke'];
                $targetKumulatif = isset($week['target_kumulatif']) ? (float) $week['target_kumulatif'] : 0;
                $itemIds = $week['rab_item_ids'] ?? [];

                if (!$isFullSync) {
                    ProjectSchedule::where('project_id', $projectId)->where('minggu_ke', $mingguKe)->delete();
                }

                $itemCount = count($itemIds);
                if ($itemCount > 0) {
                    // PEMBAGIAN RATA TARGET KUMULATIF KE ITEM AGAR BISA TERBACA OLEH KODE REACT LAMA
                    $portion = round($targetKumulatif / $itemCount, 4);

                    foreach ($itemIds as $itemId) {
                        $insertData[] = [
                            'project_id' => $projectId,
                            'rab_item_id' => $itemId,
                            'minggu_ke' => $mingguKe,
                            'bulan' => !empty($week['bulan']) ? $week['bulan'] : null,
                            'tanggal_awal' => !empty($week['tanggal_awal']) ? $week['tanggal_awal'] : null,
                            'tanggal_akhir' => !empty($week['tanggal_akhir']) ? $week['tanggal_akhir'] : null,
                            'bobot_rencana' => $portion,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            ProjectSchedule::insert($insertData);

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Jadwal Mingguan Berhasil Diperbarui!']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan jadwal: ' . $e->getMessage()
            ], 500);
        }
    }

    private function saveChartImage($base64String)
    {
        if (!$base64String) return null;
        $parts = explode(";base64,", $base64String);
        if (count($parts) < 2) return null;
        $decoded = base64_decode($parts[1]);
        $tempPath = sys_get_temp_dir() . '/' . uniqid('kurva_') . '.jpg';
        file_put_contents($tempPath, $decoded);
        return $tempPath;
    }

    public function exportKurvaPdf(Request $request, $projectId)
    {
        ini_set('max_execution_time', 300);
        ini_set('memory_limit', '1024M');
        $project = Project::findOrFail($projectId);
        $chartImageBase64 = $request->chart_image;
        $itemProgress = $request->item_progress ?? [];
        $chartData = $request->chart_data ?? [];
        $viewMode = $request->view_mode ?? 'harian';
        $startDate = $request->start_date ?? null;
        $endDate = $request->end_date ?? null;
        $pdf = Pdf::setOptions(['isHtml5ParserEnabled' => true, 'isRemoteEnabled' => true])
                  ->loadView('exports.kurva-s', compact('project', 'chartImageBase64', 'itemProgress', 'chartData', 'viewMode', 'startDate', 'endDate'))
                  ->setPaper('a4', 'landscape');
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $project->kode_kontrak);
        return $pdf->download('Kurva_S_' . $safeName . '.pdf');
    }

    public function exportKurvaExcel(Request $request, $projectId)
    {
        ini_set('max_execution_time', 300);
        ini_set('memory_limit', '1024M');
        $project = Project::findOrFail($projectId);
        $imagePath = $this->saveChartImage($request->chart_image);
        $itemProgress = $request->item_progress ?? [];
        $chartData = $request->chart_data ?? [];
        $viewMode = $request->view_mode ?? 'harian';
        $startDate = $request->start_date ?? null;
        $endDate = $request->end_date ?? null;
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $project->kode_kontrak);
        return Excel::download(new KurvaExport($project, $itemProgress, $chartData, $viewMode, $imagePath, $startDate, $endDate), 'Kurva_S_' . $safeName . '.xlsx');
    }
}
