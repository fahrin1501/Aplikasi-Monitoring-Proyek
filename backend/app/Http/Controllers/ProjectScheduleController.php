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
     * Menarik Data Jadwal Rencana & Data Realisasi Laporan Harian
     */
    public function getSchedules($projectId)
    {
        $project = Project::findOrFail($projectId);

        $rabData = RabCategory::with(['items' => function($q) {
            $q->orderBy('id', 'asc');
        }])->where('project_id', $projectId)->get();

        $schedules = ProjectSchedule::where('project_id', $projectId)->get();

        $grandTotalRAB = 0;
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader) {
                    $grandTotalRAB += (float)$item->total_harga;
                }
            }
        }

        foreach($rabData as $cat) {
            $bobotDivisi = 0;
            foreach($cat->items as $item) {
                if(!$item->is_subheader && $grandTotalRAB > 0) {
                    $bobotStandar = ($item->total_harga / $grandTotalRAB) * 100;
                    $bobotDivisi += $bobotStandar;

                    $totalDijadwalkan = $schedules->where('rab_item_id', $item->id)->sum('bobot_rencana');
                    $sisaBobot = max(0, $bobotStandar - $totalDijadwalkan);

                    $item->bobot_standar = round($bobotStandar, 4);
                    $item->total_dijadwalkan = round($totalDijadwalkan, 4);
                    $item->sisa_bobot = round($sisaBobot, 4);
                } else {
                    $item->bobot_standar = 0;
                    $item->total_dijadwalkan = 0;
                    $item->sisa_bobot = 0;
                }
            }
            $cat->bobot_divisi = round($bobotDivisi, 4);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'project_info' => $project,
                'rab_data' => $rabData,
                'schedules' => $schedules
            ]
        ]);
    }

    /**
     * Menyimpan Data Jadwal (Struktur MVC Baru: Weekly Based)
     */
    public function saveSchedules(Request $request, $projectId)
    {
        $request->validate([
            'weeks' => 'required|array'
        ]);

        DB::beginTransaction();
        try {
            $isFullSync = $request->input('full_sync', false);

            // Jika dipanggil dari Edit Draf (ScheduleData.jsx), bersihkan semua jadwal proyek ini
            if ($isFullSync) {
                ProjectSchedule::where('project_id', $projectId)->delete();
            }

            $insertData = [];
            $now = now();

            foreach ($request->weeks as $week) {
                $mingguKe = $week['minggu_ke'];
                $targetKumulatif = isset($week['target_kumulatif']) ? (float) $week['target_kumulatif'] : 0;
                $itemIds = $week['rab_item_ids'] ?? [];

                // Jika dipanggil dari Tambah Jadwal (AddSchedule.jsx), bersihkan hanya jadwal di minggu terkait
                if (!$isFullSync) {
                    ProjectSchedule::where('project_id', $projectId)->where('minggu_ke', $mingguKe)->delete();
                }

                $itemCount = count($itemIds);
                if ($itemCount > 0) {
                    // Back-end secara diam-diam membagi target untuk kompatibilitas S-Curve
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

            // Eksekusi insert massal yang jauh lebih cepat dan kebal error
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
        $safeName = preg_replace('/[^A-Za-z0-9]/', '_', $project->kode_kontrak);
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
        $safeName = preg_replace('/[^A-Za-z0-9]/', '_', $project->kode_kontrak);
        return Excel::download(new KurvaExport($project, $itemProgress, $chartData, $viewMode, $imagePath, $startDate, $endDate), 'Kurva_S_' . $safeName . '.xlsx');
    }
}
