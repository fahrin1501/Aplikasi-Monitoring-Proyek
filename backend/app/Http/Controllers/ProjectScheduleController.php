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

        // 3. Ambil Jadwal Rencana Mingguan (Untuk Target S-Curve & Table Schedule)
        $schedules = ProjectSchedule::where('project_id', $projectId)->get();

        // 4. Hitung Grand Total Uang RAB (Untuk pembagi dasar)
        $grandTotalRAB = 0;
        foreach($rabData as $cat) {
            foreach($cat->items as $item) {
                if(!$item->is_subheader) {
                    $grandTotalRAB += (float)$item->total_harga;
                }
            }
        }

        // ==========================================
        // 5. KALKULASI REALISASI AKTUAL (LAPORAN HARIAN) UNTUK S-CURVE
        // ==========================================
        // Tarik laporan harian yang HANYA BERSTATUS APPROVED (Disetujui PPK/Pengawas)
        $approvedReports = DailyReport::with('activities')
            ->where('project_id', $projectId)
            ->where('status', 'approved')
            ->orderBy('tanggal', 'asc')
            ->get();

        $realizations = [];
        $realizedVolumes = []; // Menyimpan akumulasi Volume mentah

        foreach ($approvedReports as $report) {
            // Ambil "Minggu Ke-" sesuai dengan isian manual di Laporan (bukan hitungan otomatis lagi)
            $mingguKe = $report->minggu_ke ?: 0;

            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {
                    // Akumulasi volume
                    if (!isset($realizedVolumes[$act->rab_item_id])) {
                        $realizedVolumes[$act->rab_item_id] = 0;
                    }
                    $realizedVolumes[$act->rab_item_id] += (float)$act->volume;

                    // Mengambil Persentase yang diketik manual di form Laporan (Prioritas Utama)
                    // Jika user tidak mengisi persen di Laporan, fallback ke Volume * Harga
                    $bobotRealisasi = 0;
                    if (!is_null($act->persentase)) {
                        $bobotRealisasi = (float)$act->persentase;
                    } else {
                        // Fallback (Jaga-jaga jika input persen kosong)
                        $rabItem = RabItem::find($act->rab_item_id);
                        if ($rabItem && $grandTotalRAB > 0) {
                            $bobotTotalRAB = ($rabItem->total_harga / $grandTotalRAB) * 100;
                            $volumeTotalRAB = $rabItem->volume > 0 ? $rabItem->volume : 1;
                            $bobotRealisasi = ($act->volume / $volumeTotalRAB) * $bobotTotalRAB;
                        }
                    }

                    $realizations[] = [
                        'rab_item_id' => $act->rab_item_id,
                        'minggu_ke' => $mingguKe,
                        'volume_laporan' => $act->volume,
                        'bobot_realisasi' => $bobotRealisasi, // <-- Injeksi Persen Aktua S-Curve
                        'tgl_input' => $report->tanggal,
                        'tgl_verifikasi' => Carbon::parse($report->verified_at)->format('Y-m-d'),
                    ];
                }
            }
        }

        // ==========================================
        // 6. INJEKSI DATA KE RESPONSE JSON UNTUK TABEL JADWAL
        // ==========================================
        foreach($rabData as $cat) {
            $bobotDivisi = 0;

            foreach($cat->items as $item) {
                if(!$item->is_subheader && $grandTotalRAB > 0) {
                    $bobotStandar = ($item->total_harga / $grandTotalRAB) * 100;
                    $bobotDivisi += $bobotStandar;

                    // Ambil rencana kumulatif yang dibagi rata dari backend di form Jadwal
                    $totalDijadwalkan = $schedules->where('rab_item_id', $item->id)->sum('bobot_rencana');

                    // SISA BOBOT (Opsional, tapi tetap dihitung untuk info tabel)
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
                'project_info' => [
                    'nama_proyek' => $project->nama_proyek,
                    'tanggal_mulai' => $project->tanggal_mulai,
                    'tanggal_selesai' => $project->tanggal_selesai,
                    'total_hari' => $totalHari,
                    'total_minggu' => $totalMinggu
                ],
                'rab_data' => $rabData,
                'schedules' => $schedules, // <-- Rencana Mingguan untuk S-Curve dikirim dari sini
                'realizations' => $realizations // <-- Realisasi Harian (Persen Laporan) untuk S-Curve dikirim dari sini
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
