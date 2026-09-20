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
        foreach ($approvedReports as $report) {
            // Tentukan laporan ini masuk di Minggu Ke-Berapa?
            $start = Carbon::parse($project->tanggal_mulai)->startOfDay();
            $reportDate = Carbon::parse($report->tanggal)->startOfDay();
            $diffDays = $start->diffInDays($reportDate, false);

            // Jika ada laporan sebelum tanggal SPMK, masukkan ke minggu ke-0/1
            $mingguKe = ($diffDays >= 0) ? floor($diffDays / 7) + 1 : 0;

            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {
                    $rabItem = RabItem::find($act->rab_item_id);

                    // Amankan dari Error Division by Zero (Bagi dengan 0)
                    if ($rabItem && $grandTotalRAB > 0) {

                        // RUMUS EMAS MANAJEMEN KONSTRUKSI (Nilai Bobot Serapan Aktual)
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
            // TEKNIK BULK SYNC:
            // 1. Hapus bersih semua jadwal proyek ini (Termasuk yang di-delete User di React)
            ProjectSchedule::where('project_id', $projectId)->delete();

            $insertData = [];
            $now = now();

            // 2. Timpa dengan semua isi array baru dari React
            if (!empty($request->schedules)) {
                foreach ($request->schedules as $sched) {
                    $insertData[] = [
                        'project_id' => $projectId,
                        'rab_item_id' => $sched['rab_item_id'],
                        'minggu_ke' => $sched['minggu_ke'],
                        'bobot_rencana' => $sched['bobot_rencana'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                // Eksekusi Massal (Ribuan data pun hanya butuh 1 query ke Database)
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

    public function destroySchedules($projectId)
    {
        try {
            // Hapus semua data jadwal (Time Schedule) milik proyek ini
            ProjectSchedule::where('project_id', $projectId)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Seluruh jadwal time schedule proyek berhasil dihapus (Reset).'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()
            ], 500);
        }
    }

// --- FUNGSI BANTUAN UNTUK MENYIMPAN GAMBAR CHART ---
    private function saveChartImage($base64String)
    {
        if (!$base64String) return null;
        $imageParts = explode(";base64,", $base64String);

        // FIX ERROR 500: Deteksi otomatis apakah itu jpeg atau png dari header Base64
        $extension = 'png';
        if (str_contains($imageParts[0], 'jpeg') || str_contains($imageParts[0], 'jpg')) {
            $extension = 'jpg';
        }

        $decoded = base64_decode($imageParts[1]);
        $filename = 'kurva_' . time() . '.' . $extension;

        // Simpan sementara di storage/app/public/temp
        Storage::disk('public')->put('temp/' . $filename, $decoded);
        return public_path('storage/temp/' . $filename);
    }

    // --- EXPORT PDF KURVA S (LENGKAP DENGAN TABEL) ---
    public function exportKurvaPdf(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        $imagePath = $this->saveChartImage($request->chart_image);

        // Tangkap array dari Frontend
        $itemProgress = $request->item_progress ?? [];
        $chartData = $request->chart_data ?? [];
        $viewMode = $request->view_mode ?? 'harian';

        // Tangkap Range Tanggal Filter
        $startDate = $request->start_date ?? null;
        $endDate = $request->end_date ?? null;

        $pdf = Pdf::loadView('exports.kurva-s', compact('project', 'imagePath', 'itemProgress', 'chartData', 'viewMode', 'startDate', 'endDate'))->setPaper('a4', 'landscape');
        return $pdf->download('Kurva_S_' . $project->kode_kontrak . '.pdf');
    }

    // --- EXPORT EXCEL KURVA S (LENGKAP DENGAN TABEL) ---
    public function exportKurvaExcel(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        $imagePath = $this->saveChartImage($request->chart_image);

        // Tangkap array dari Frontend
        $itemProgress = $request->item_progress ?? [];
        $chartData = $request->chart_data ?? [];
        $viewMode = $request->view_mode ?? 'harian';

        // Tangkap Range Tanggal Filter
        $startDate = $request->start_date ?? null;
        $endDate = $request->end_date ?? null;

        return Excel::download(new KurvaExport($project, $itemProgress, $chartData, $viewMode, $imagePath, $startDate, $endDate), 'Kurva_S_' . $project->kode_kontrak . '.xlsx');
    }
}
