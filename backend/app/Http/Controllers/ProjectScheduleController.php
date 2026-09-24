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

        $totalHari = 0;
        $totalMinggu = 0;

        // 1. Hitung durasi proyek (Total Minggu) berdasarkan kontrak
        if ($project->tanggal_mulai && $project->tanggal_selesai) {
            $start = Carbon::parse($project->tanggal_mulai)->startOfDay();
            $end = Carbon::parse($project->tanggal_selesai)->startOfDay();

            if ($end->greaterThanOrEqualTo($start)) {
                $totalHari = $start->diffInDays($end) + 1;
                $totalMinggu = ceil($totalHari / 7);
            }
        }

        // 2. Ambil Master Data RAB & Jadwal
        $rabData = RabCategory::with(['items' => function($q) {
            $q->orderBy('id', 'asc');
        }])->where('project_id', $projectId)->get();

        $schedules = ProjectSchedule::where('project_id', $projectId)->get();

        // 3. Hitung Grand Total Uang RAB (Untuk pembagi 100%)
        $grandTotalRAB = 0;
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader) {
                    $grandTotalRAB += (float)$item->total_harga;
                }
            }
        }

        // ==========================================
        // 4. KALKULASI REALISASI AKTUAL (LAPANGAN)
        // ==========================================
        $approvedReports = DailyReport::with('activities')
            ->where('project_id', $projectId)
            ->where('status', 'approved')
            ->orderBy('tanggal', 'asc')
            ->get();

        $realizations = [];
        $realizedVolumes = [];

        foreach ($approvedReports as $report) {
            $start = Carbon::parse($project->tanggal_mulai)->startOfDay();
            $reportDate = Carbon::parse($report->tanggal)->startOfDay();
            $diffDays = $start->diffInDays($reportDate, false);
            $mingguKe = ($diffDays >= 0) ? floor($diffDays / 7) + 1 : 0;

            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {
                    if (!isset($realizedVolumes[$act->rab_item_id])) {
                        $realizedVolumes[$act->rab_item_id] = 0;
                    }
                    $realizedVolumes[$act->rab_item_id] += (float)$act->volume;

                    $rabItem = RabItem::find($act->rab_item_id);

                    if ($rabItem && $grandTotalRAB > 0) {
                        $bobotTotalRAB = ($rabItem->total_harga / $grandTotalRAB) * 100;
                        $volumeTotalRAB = $rabItem->volume > 0 ? $rabItem->volume : 1;
                        $bobotRealisasi = ($act->volume / $volumeTotalRAB) * $bobotTotalRAB;

                        $realizations[] = [
                            'rab_item_id' => $act->rab_item_id,
                            'minggu_ke' => $mingguKe,
                            'volume_laporan' => $act->volume,
                            'bobot_realisasi' => $bobotRealisasi,
                            'tgl_input' => $report->tanggal,
                            'tgl_verifikasi' => Carbon::parse($report->verified_at)->format('Y-m-d'),
                        ];
                    }
                }
            }
        }

        // ==========================================
        // 5. KALKULASI SISA BOBOT & INJEKSI KE RAB
        // ==========================================
        foreach($rabData as $cat) {
            $bobotDivisi = 0;
            foreach($cat->items as $item) {
                if(!$item->is_subheader && $grandTotalRAB > 0) {
                    // Bobot Murni Item
                    $bobotStandar = ($item->total_harga / $grandTotalRAB) * 100;
                    $bobotDivisi += $bobotStandar;

                    // Berapa yang sudah pernah dimasukkan ke jadwal?
                    $totalDijadwalkan = $schedules->where('rab_item_id', $item->id)->sum('bobot_rencana');

                    // Berapa yang sudah direalisasikan di Lapangan?
                    $volRealisasi = $realizedVolumes[$item->id] ?? 0;
                    $volTotal = $item->volume > 0 ? $item->volume : 1;
                    $bobotRealisasi = ($volRealisasi / $volTotal) * $bobotStandar;

                    // SISA BOBOT PLAFON
                    $sisaBobot = max(0, $bobotStandar - $totalDijadwalkan);

                    // Suntikkan ke JSON Response
                    $item->bobot_standar = round($bobotStandar, 4);
                    $item->total_dijadwalkan = round($totalDijadwalkan, 4);
                    $item->bobot_realisasi = round($bobotRealisasi, 4);
                    $item->sisa_bobot = round($sisaBobot, 4);
                } else {
                    $item->bobot_standar = 0;
                    $item->total_dijadwalkan = 0;
                    $item->bobot_realisasi = 0;
                    $item->sisa_bobot = 0;
                }
            }
            $cat->bobot_divisi = round($bobotDivisi, 4);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'project_info' => [
                    'nama_proyek' => $project->nama_proyek,
                    'tanggal_mulai' => $project->tanggal_mulai,
                    'tanggal_selesai' => $project->tanggal_selesai,
                    'total_hari' => $totalHari,
                    'total_minggu' => $totalMinggu
                ],
                'rab_data' => $rabData,
                'schedules' => $schedules,
                'realizations' => $realizations
            ]
        ]);
    }

    /**
     * Menyimpan/Memperbarui Data Jadwal (Update Or Create Mode)
     */
    public function saveSchedules(Request $request, $projectId)
    {
        $request->validate(['schedules' => 'array']);

        DB::beginTransaction();
        try {
            if (!empty($request->schedules)) {
                foreach ($request->schedules as $sched) {
                    // PERBAIKAN: Gunakan updateOrCreate untuk mencegah data ganda / double input
                    ProjectSchedule::updateOrCreate(
                        [
                            'project_id' => $projectId,
                            'rab_item_id' => $sched['rab_item_id'],
                            'minggu_ke' => $sched['minggu_ke'],
                        ],
                        [
                            'bulan' => $sched['bulan'] ?? null,
                            'tanggal_awal' => $sched['tanggal_awal'] ?? null,
                            'tanggal_akhir' => $sched['tanggal_akhir'] ?? null,
                            'bobot_rencana' => $sched['bobot_rencana'],
                            'updated_at' => now()
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Jadwal Mingguan Berhasil Diperbarui!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan jadwal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fungsi untuk menghapus jadwal spesifik dari database
     */
    public function destroySchedules(Request $request, $projectId)
    {
        $query = ProjectSchedule::where('project_id', $projectId);

        if ($request->has('minggu_ke')) {
            $query->where('minggu_ke', $request->minggu_ke);
        }
        if ($request->has('rab_item_id')) {
            $query->where('rab_item_id', $request->rab_item_id);
        }

        $query->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data jadwal berhasil dihapus permanen dari database.'
        ]);
    }

    // ==========================================================
    // --- FUNGSI BANTUAN UNTUK MENYIMPAN GAMBAR CHART ---
    // ==========================================================
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

    // ==========================================================
    // --- EXPORT PDF KURVA S ---
    // ==========================================================
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

    // ==========================================================
    // --- EXPORT EXCEL KURVA S ---
    // ==========================================================
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
