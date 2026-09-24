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

        // 1. Ambil Data RAB & Jadwal yang sudah ada di database
        $rabData = RabCategory::with(['items' => function($q) {
            $q->orderBy('id', 'asc');
        }])->where('project_id', $projectId)->get();

        $schedules = ProjectSchedule::where('project_id', $projectId)->get();

        // 2. Hitung Grand Total Uang RAB (Untuk pembagi 100%)
        $grandTotalRAB = 0;
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader) {
                    $grandTotalRAB += (float)$item->total_harga;
                }
            }
        }

        // 3. KALKULASI LOGIKA BACKEND (DIKIRIM MATANG KE FRONTEND)
        foreach($rabData as $cat) {
            $bobotDivisi = 0; // Total persenan untuk Divisi ini

            foreach($cat->items as $item) {
                if(!$item->is_subheader && $grandTotalRAB > 0) {
                    // A. Bobot Murni Item (Harga Item / Grand Total * 100)
                    $bobotStandar = ($item->total_harga / $grandTotalRAB) * 100;
                    $bobotDivisi += $bobotStandar;

                    // B. Berapa yang sudah pernah dimasukkan ke jadwal (Tabel project_schedules)?
                    $totalDijadwalkan = $schedules->where('rab_item_id', $item->id)->sum('bobot_rencana');

                    // C. SISA BOBOT (Ini yang akan diinput user di React)
                    $sisaBobot = max(0, $bobotStandar - $totalDijadwalkan);

                    // Suntikkan ke JSON
                    $item->bobot_standar = round($bobotStandar, 4);
                    $item->total_dijadwalkan = round($totalDijadwalkan, 4);
                    $item->sisa_bobot = round($sisaBobot, 4);
                } else {
                    $item->bobot_standar = 0;
                    $item->total_dijadwalkan = 0;
                    $item->sisa_bobot = 0;
                }
            }
            // Suntikkan total divisi ke JSON
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
     * Menyimpan/Memperbarui Data Jadwal (Update Or Create Mode)
     */
    public function saveSchedules(Request $request, $projectId)
    {
        $request->validate(['schedules' => 'array']);

        DB::beginTransaction();
        try {
            if (!empty($request->schedules)) {
                foreach ($request->schedules as $sched) {

                    // PERLINDUNGAN 1: Cegah MySQL Crash akibat "Empty String" diubah paksa menjadi NULL
                    $tglAwal = !empty($sched['tanggal_awal']) ? $sched['tanggal_awal'] : null;
                    $tglAkhir = !empty($sched['tanggal_akhir']) ? $sched['tanggal_akhir'] : null;
                    $bulan = !empty($sched['bulan']) ? $sched['bulan'] : null;

                    // PERLINDUNGAN 2: Cegah Data Truncated karena desimal pembagian frontend terlalu panjang
                    $bobotRencana = isset($sched['bobot_rencana']) ? round((float)$sched['bobot_rencana'], 4) : 0;

                    ProjectSchedule::updateOrCreate(
                        [
                            'project_id' => $projectId,
                            'rab_item_id' => $sched['rab_item_id'],
                            'minggu_ke' => $sched['minggu_ke'],
                        ],
                        [
                            'bulan' => $bulan,
                            'tanggal_awal' => $tglAwal,
                            'tanggal_akhir' => $tglAkhir,
                            'bobot_rencana' => $bobotRencana,
                            'updated_at' => now()
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Jadwal Mingguan Berhasil Ditambahkan!']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                // Mengembalikan pesan asli error jika terjadi masalah lain agar mudah di-debug
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
