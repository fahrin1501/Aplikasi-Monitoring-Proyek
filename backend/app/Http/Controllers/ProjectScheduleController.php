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

        // 2. Ambil Master Data RAB
        $rabData = RabCategory::with(['items' => function($q) {
            $q->orderBy('id', 'asc');
        }])->where('project_id', $projectId)->get();

        // 3. Ambil Master Jadwal yang sudah pernah diinput (Rencana)
        $schedules = ProjectSchedule::where('project_id', $projectId)->get();

        // ==========================================
        // 4. KALKULASI REALISASI AKTUAL (LAPANGAN)
        // ==========================================

        // A. Hitung Grand Total Uang RAB untuk mencari persentase (100%)
        $grandTotalRAB = 0;
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader) {
                    $grandTotalRAB += (float)$item->total_harga;
                }
            }
        }

        // B. Tarik laporan harian yang HANYA BERSTATUS APPROVED (Disetujui PPK)
        $approvedReports = DailyReport::with('activities')
            ->where('project_id', $projectId)
            ->where('status', 'approved')
            ->orderBy('tanggal', 'asc')
            ->get();

        $realizations = [];
        $realizedVolumes = []; // Menampung agregat volume aktual per item

        foreach ($approvedReports as $report) {
            $start = Carbon::parse($project->tanggal_mulai)->startOfDay();
            $reportDate = Carbon::parse($report->tanggal)->startOfDay();
            $diffDays = $start->diffInDays($reportDate, false);
            $mingguKe = ($diffDays >= 0) ? floor($diffDays / 7) + 1 : 0;

            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {

                    // Akumulasi volume per RAB item untuk perhitungan sisa bobot
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

        // C. SUNTIKAN DATA KE MASTER RAB (Backend yang menghitung semuanya!)
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader && $grandTotalRAB > 0) {
                    // 1. Bobot Standar Murni (Target RAB 100%)
                    $bobotStandar = ($item->total_harga / $grandTotalRAB) * 100;

                    // 2. Bobot yang telah berhasil direalisasikan di Lapangan
                    $volRealisasi = $realizedVolumes[$item->id] ?? 0;
                    $volTotal = $item->volume > 0 ? $item->volume : 1;
                    $bobotRealisasi = ($volRealisasi / $volTotal) * $bobotStandar;

                    // 3. Bobot yang sedang diagendakan di kalender (Time Schedule)
                    $totalDijadwalkan = $schedules->where('rab_item_id', $item->id)->sum('bobot_rencana');

                    // Injeksi properti dinamis ke objek agar React tinggal pakai
                    $item->bobot_standar = round($bobotStandar, 4);
                    $item->bobot_realisasi = round($bobotRealisasi, 4);
                    $item->total_dijadwalkan = round($totalDijadwalkan, 4);
                    $item->sisa_plafon_tersedia = max(0, round($bobotStandar - $bobotRealisasi, 4));
                } else {
                    $item->bobot_standar = 0;
                    $item->bobot_realisasi = 0;
                    $item->total_dijadwalkan = 0;
                    $item->sisa_plafon_tersedia = 0;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'project_info' => [
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
     * Menyimpan/Memperbarui Data Jadwal (Bulk Sync Mode)
     */
    public function saveSchedules(Request $request, $projectId)
    {
        $request->validate([
            'schedules' => 'array'
        ]);

        DB::beginTransaction();
        try {
            // TEKNIK BULK SYNC: Hapus bersih lalu insert ulang agar cepat
            ProjectSchedule::where('project_id', $projectId)->delete();

            $insertData = [];
            $now = now();

            if (!empty($request->schedules)) {
                foreach ($request->schedules as $sched) {
                    $insertData[] = [
                        'project_id' => $projectId,
                        'rab_item_id' => $sched['rab_item_id'],
                        'minggu_ke' => $sched['minggu_ke'],
                        'bulan' => $sched['bulan'] ?? null,
                        'tanggal_awal' => $sched['tanggal_awal'] ?? null,
                        'tanggal_akhir' => $sched['tanggal_akhir'] ?? null,
                        'bobot_rencana' => $sched['bobot_rencana'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                // Eksekusi Massal
                ProjectSchedule::insert($insertData);
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Time Schedule berhasil disinkronkan!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan jadwal: ' . $e->getMessage()
            ], 500);
        }
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

        // MENGGUNAKAN TEMP DIRECTORY OS UNTUK BYPASS FOLDER STORAGE
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

        // Untuk PDF, langsung baca Base64 di blade agar tidak perlu memanggil file fisik
        $chartImageBase64 = $request->chart_image;

        $itemProgress = $request->item_progress ?? [];
        $chartData = $request->chart_data ?? [];
        $viewMode = $request->view_mode ?? 'harian';

        $startDate = $request->start_date ?? null;
        $endDate = $request->end_date ?? null;

        $pdf = Pdf::setOptions(['isHtml5ParserEnabled' => true, 'isRemoteEnabled' => true])
                  ->loadView('exports.kurva-s', compact('project', 'chartImageBase64', 'itemProgress', 'chartData', 'viewMode', 'startDate', 'endDate'))
                  ->setPaper('a4', 'landscape');

        // Mencegah error garis miring pada nama file
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

        // Excel butuh file fisik
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
