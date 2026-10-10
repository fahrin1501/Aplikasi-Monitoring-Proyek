<?php

namespace App\Http\Controllers;

use App\Models\DailyReport;
use App\Models\DailyReportAttachment;
use App\Models\RabCategory;
use App\Models\RabItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DailyReportExport;
use App\Services\ProjectProgressService;
use App\Services\ProjectCacheService;
use App\Services\RabService;
use Exception;
use Throwable;

class DailyReportController extends Controller
{
    private $progressService;

    public function __construct(ProjectProgressService $progressService)
    {
        $this->progressService = $progressService;
    }

    // =========================================================================
    // HELPER: Auto-Create RAB untuk Pekerjaan Manual
    // =========================================================================
    private function resolveManualRabItem($projectId, $uraian, $satuan)
    {
        $category = RabCategory::firstOrCreate(
            [
                'project_id' => $projectId,
                'nama_kategori' => 'PEKERJAAN TAMBAHAN (ADDENDUM)'
            ],
            [
                'kode_divisi' => 'ADD'
            ]
        );

        $item = RabItem::firstOrCreate(
            [
                'rab_category_id' => $category->id,
                'uraian_pekerjaan' => $uraian
            ],
            [
                'kode_pekerjaan' => '-',
                'satuan' => !empty($satuan) ? $satuan : 'Ls',
                'volume' => 0,          // Default 0 karena belum ada nilai kontrak
                'harga_satuan' => 0,    // Default 0
                'total_harga' => 0,
                'is_subheader' => false
            ]
        );

        return $item->id;
    }

    private function syncProjectStatus($projectId)
    {
        $project = \App\Models\Project::find($projectId);
        if (!$project) return;

        $hasReports = DailyReport::where('project_id', $projectId)->exists();

        if (!$hasReports) {
            if (in_array($project->status, ['Berjalan', 'Selesai'])) {
                $project->update(['status' => 'Persiapan']);
            }
            return;
        }

        $totalRab = $this->progressService->calculateTotalProjectValue($projectId);

        $totalRealisasiUang = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->join('rab_items', 'daily_report_activities.rab_item_id', '=', 'rab_items.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->sum(DB::raw('COALESCE( (daily_report_activities.persentase / 100) * rab_items.total_harga, daily_report_activities.volume * rab_items.harga_satuan )'));

        if ($totalRab > 0) {
            $progress = ($totalRealisasiUang / $totalRab) * 100;
            if ($progress >= 99.99) {
                $project->update(['status' => 'Selesai']);
            } else {
                if (in_array($project->status, ['Persiapan', 'Selesai'])) {
                    $project->update(['status' => 'Berjalan']);
                }
            }
        } else {
            if ($project->status === 'Persiapan') {
                $project->update(['status' => 'Berjalan']);
            }
        }
    }

    public function index()
    {
        try {
            $reports = \Illuminate\Support\Facades\Cache::remember('all_daily_reports_list_cache', \App\Services\ProjectCacheService::TTL, function () {
                return DailyReport::with(['project', 'activities', 'personnels', 'equipments', 'attachments'])
                            ->orderBy('tanggal', 'desc')
                            ->get();
            });
            return response()->json(['status' => 'success', 'data' => $reports]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments', 'attachments'])->findOrFail($id);
            return response()->json(['status' => 'success', 'data' => $report]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Laporan tidak ditemukan'], 404);
        }
    }

    public function store(Request $request, $projectId)
    {
        try {
            DB::beginTransaction();

            $request->validate([
                'tanggal' => 'required|date',
                'minggu_ke' => 'required',
                'pengawas' => 'required|string',
                'lokasi' => 'required|string',
                'foto.*' => 'image|max:5120',
                'lampiran.*' => 'file|mimes:pdf,xls,xlsx,doc,docx,zip,rar|max:20480'
            ]);

            $report = DailyReport::create([
                'project_id' => $projectId,
                'tanggal' => $request->tanggal,
                'minggu_ke' => $request->minggu_ke,
                'pengawas' => $request->pengawas,
                'lokasi' => $request->lokasi,
                'cuaca' => $request->cuaca,
                'kondisi_cuaca' => $request->kondisi_cuaca,
                'catatan' => $request->catatan,
                'status' => 'pending',
            ]);

            $kegiatan = json_decode($request->kegiatan, true) ?? [];
            $personil = json_decode($request->personil, true) ?? [];
            $peralatan = json_decode($request->peralatan, true) ?? [];

            $totalProjectValue = $this->progressService->calculateTotalProjectValue($projectId);

            foreach ($kegiatan as $item) {
                if (!empty($item['uraian'])) {
                    $volume = (isset($item['volume']) && $item['volume'] !== '') ? (float) $item['volume'] : null;
                    $persentase = (isset($item['persentase']) && $item['persentase'] !== '') ? $item['persentase'] : null;
                    $satuan = !empty($item['satuan']) ? $item['satuan'] : null;
                    $rabItemId = !empty($item['rab_item_id']) ? $item['rab_item_id'] : null;

                    // 1. OTOMATIS BUAT/AMBIL ID RAB JIKA INPUT MANUAL
                    if (empty($rabItemId)) {
                        $rabItemId = $this->resolveManualRabItem($projectId, $item['uraian'], $satuan);
                    }

                    // 2. JANGAN OVERRIDE PERSENTASE JIKA HARGA RAB NYA MASIH 0 (Pekerjaan baru)
                    if ($rabItemId && $volume > 0) {
                        $checkRab = RabItem::find($rabItemId);
                        if ($checkRab && $checkRab->total_harga > 0) {
                            $persentase = $this->progressService->calculateItemProgress(
                                $rabItemId,
                                $volume,
                                $totalProjectValue
                            );
                        }
                    }

                    $report->activities()->create([
                        'rab_item_id' => $rabItemId,
                        'uraian' => $item['uraian'],
                        'sta_awal' => $item['sta_awal'] ?? null,
                        'sta_akhir' => $item['sta_akhir'] ?? null,
                        'volume' => $volume,
                        'satuan' => $satuan,
                        'persentase' => $persentase,
                    ]);
                }
            }

            foreach ($personil as $item) {
                if (!empty($item['peran']) && !empty($item['jumlah'])) {
                    $report->personnels()->create(['peran' => $item['peran'], 'jumlah' => $item['jumlah']]);
                }
            }

            foreach ($peralatan as $item) {
                $namaAlat = $item['nama_alat'] ?? $item['namaAlat'] ?? null;
                if (!empty($namaAlat) && !empty($item['jumlah'])) {
                    $report->equipments()->create(['nama_alat' => $namaAlat, 'jumlah' => $item['jumlah']]);
                }
            }

            if ($request->hasFile('foto')) {
                foreach ($request->file('foto') as $file) {
                    $fileName = time() . '_foto_' . str_replace(' ', '_', $file->getClientOriginalName());
                    $path = $file->storeAs('foto_laporan', $fileName, 'public');
                    $report->attachments()->create(['tipe' => 'foto', 'nama_file' => $file->getClientOriginalName(), 'path_file' => 'storage/' . $path]);
                }
            }

            if ($request->hasFile('lampiran')) {
                foreach ($request->file('lampiran') as $file) {
                    $fileName = time() . '_lampiran_' . str_replace(' ', '_', $file->getClientOriginalName());
                    $path = $file->storeAs('dokumen_laporan', $fileName, 'public');
                    $report->attachments()->create(['tipe' => 'dokumen', 'nama_file' => $file->getClientOriginalName(), 'path_file' => 'storage/' . $path]);
                }
            }

            $this->syncProjectStatus($projectId);

            DB::commit();

            RabService::clearCache($projectId);

            return response()->json(['status' => 'success', 'message' => 'Laporan Harian Berhasil Disimpan!']);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $report = DailyReport::findOrFail($id);
            $totalProjectValue = $this->progressService->calculateTotalProjectValue($report->project_id);

            $report->update([
                'tanggal' => $request->tanggal ?? $report->tanggal,
                'minggu_ke' => $request->minggu_ke ?? $report->minggu_ke,
                'pengawas' => $request->pengawas ?? $report->pengawas,
                'lokasi' => $request->lokasi ?? $report->lokasi,
                'cuaca' => $request->cuaca ?? $report->cuaca,
                'kondisi_cuaca' => $request->kondisi_cuaca ?? $report->kondisi_cuaca,
                'catatan' => $request->has('catatan') ? $request->catatan : $report->catatan,
                'status' => 'pending',
                'verified_at' => null
            ]);

            if ($request->has('kegiatan')) {
                $report->activities()->delete();
                $kegiatan = json_decode($request->kegiatan, true) ?? [];

                foreach ($kegiatan as $item) {
                    if (!empty($item['uraian'])) {
                        $volume = (isset($item['volume']) && $item['volume'] !== '') ? (float) $item['volume'] : null;
                        $persentase = (isset($item['persentase']) && $item['persentase'] !== '') ? $item['persentase'] : null;
                        $satuan = !empty($item['satuan']) ? $item['satuan'] : null;
                        $rabItemId = !empty($item['rab_item_id']) ? $item['rab_item_id'] : null;

                        // 1. OTOMATIS BUAT/AMBIL ID RAB JIKA INPUT MANUAL
                        if (empty($rabItemId)) {
                            $rabItemId = $this->resolveManualRabItem($report->project_id, $item['uraian'], $satuan);
                        }

                        // 2. JANGAN OVERRIDE PERSENTASE JIKA HARGA RAB MASIH 0
                        if ($rabItemId && $volume > 0) {
                            $checkRab = RabItem::find($rabItemId);
                            if ($checkRab && $checkRab->total_harga > 0) {
                                $persentase = $this->progressService->calculateItemProgress(
                                    $rabItemId,
                                    $volume,
                                    $totalProjectValue
                                );
                            }
                        }

                        $report->activities()->create([
                            'rab_item_id' => $rabItemId,
                            'uraian' => $item['uraian'],
                            'sta_awal' => $item['sta_awal'] ?? null,
                            'sta_akhir' => $item['sta_akhir'] ?? null,
                            'volume' => $volume,
                            'satuan' => $satuan,
                            'persentase' => $persentase,
                        ]);
                    }
                }
            }

            if ($request->has('personil')) {
                $report->personnels()->delete();
                $personil = json_decode($request->personil, true) ?? [];
                foreach ($personil as $item) {
                    if (!empty($item['peran']) && !empty($item['jumlah'])) {
                        $report->personnels()->create(['peran' => $item['peran'], 'jumlah' => $item['jumlah']]);
                    }
                }
            }

            if ($request->has('peralatan')) {
                $report->equipments()->delete();
                $peralatan = json_decode($request->peralatan, true) ?? [];
                foreach ($peralatan as $item) {
                    $namaAlat = $item['nama_alat'] ?? $item['namaAlat'] ?? null;
                    if (!empty($namaAlat) && !empty($item['jumlah'])) {
                        $report->equipments()->create(['nama_alat' => $namaAlat, 'jumlah' => $item['jumlah']]);
                    }
                }
            }

            $this->syncProjectStatus($report->project_id);

            DB::commit();

            RabService::clearCache($report->project_id);

            return response()->json(['status' => 'success', 'message' => 'Laporan berhasil diperbarui dan status kembali Pending.']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal mengupdate laporan: ' . $e->getMessage()], 500);
        }
    }

    public function quickUpdateActivity(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $activity = \App\Models\DailyReportActivity::findOrFail($id);
            $report = DailyReport::find($activity->daily_report_id);

            $persentase = $request->persentase;

            if ($request->has('volume') && $activity->rab_item_id) {
                $checkRab = RabItem::find($activity->rab_item_id);
                if ($checkRab && $checkRab->total_harga > 0) {
                    $totalProjectValue = $this->progressService->calculateTotalProjectValue($report->project_id);
                    $persentase = $this->progressService->calculateItemProgress(
                        $activity->rab_item_id,
                        $request->volume,
                        $totalProjectValue
                    );
                }
            }

            $activity->update([
                'volume' => $request->volume,
                'persentase' => $persentase
            ]);

            if ($report) {
                $this->syncProjectStatus($report->project_id);
            }

            DB::commit();

            if ($report) {
                RabService::clearCache($report->project_id);
            }

            return response()->json(['status' => 'success', 'message' => 'Data realisasi berhasil diperbarui']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function uploadAttachment(Request $request, $id)
    {
        $report = DailyReport::findOrFail($id);

        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $fileName = time() . '_foto_' . str_replace(' ', '_', $file->getClientOriginalName());
                $path = $file->storeAs('foto_laporan', $fileName, 'public');
                $report->attachments()->create(['tipe' => 'foto', 'nama_file' => $file->getClientOriginalName(), 'path_file' => 'storage/' . $path]);
            }
        }

        if ($request->hasFile('lampiran')) {
            foreach ($request->file('lampiran') as $file) {
                $fileName = time() . '_lampiran_' . str_replace(' ', '_', $file->getClientOriginalName());
                $path = $file->storeAs('dokumen_laporan', $fileName, 'public');
                $report->attachments()->create(['tipe' => 'dokumen', 'nama_file' => $file->getClientOriginalName(), 'path_file' => 'storage/' . $path]);
            }
        }
        return response()->json(['status' => 'success']);
    }

    public function destroyAttachment($id)
    {
        try {
            $attachment = DailyReportAttachment::findOrFail($id);
            $path = str_replace('storage/', '', $attachment->path_file);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
            $attachment->delete();
            return response()->json(['status' => 'success', 'message' => 'File berhasil dihapus']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus file'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            $report = DailyReport::findOrFail($id);
            $projectId = $report->project_id;

            foreach ($report->attachments as $attachment) {
                $path = str_replace('storage/', '', $attachment->path_file);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            $report->delete();
            $this->syncProjectStatus($projectId);

            DB::commit();

            RabService::clearCache($projectId);

            return response()->json(['status' => 'success', 'message' => 'Laporan berhasil dihapus secara permanen']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus laporan: ' . $e->getMessage()], 500);
        }
    }

    public function verifyReport($id)
    {
        try {
            $report = DailyReport::findOrFail($id);
            $report->update(['status' => 'approved', 'verified_at' => now()]);
            $this->syncProjectStatus($report->project_id);

            RabService::clearCache($report->project_id);

            return response()->json(['status' => 'success', 'message' => 'Laporan Lapangan berhasil disetujui & diverifikasi!']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal verifikasi laporan: ' . $e->getMessage()], 500);
        }
    }

    public function rejectReport($id)
    {
        try {
            $report = DailyReport::findOrFail($id);
            $report->update(['status' => 'rejected', 'verified_at' => null]);
            $this->syncProjectStatus($report->project_id);

            RabService::clearCache($report->project_id);

            return response()->json(['status' => 'success', 'message' => 'Laporan Lapangan dikembalikan (Ditolak)!']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal menolak laporan: ' . $e->getMessage()], 500);
        }
    }

    public function exportPdf($id)
    {
        try {
            $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments'])->findOrFail($id);
            $pdf = Pdf::loadView('exports.laporan-harian', [
                'report' => $report,
                'isExcel' => false,
            ])->setPaper('a4', 'portrait');
            $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $report->project->nama_proyek ?? 'Proyek');
            $fileName = 'Laporan_Harian_' . $report->tanggal . '_' . $safeName . '.pdf';
            return $pdf->download($fileName);
        } catch (Throwable $e) {
            \Log::error("Gagal export PDF Laporan: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportExcel($id)
    {
        try {
            $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments'])->findOrFail($id);
            $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $report->project->nama_proyek ?? 'Proyek');
            $fileName = 'Laporan_Harian_' . $report->tanggal . '_' . $safeName . '.xlsx';
            return Excel::download(new DailyReportExport($report), $fileName);
        } catch (Throwable $e) {
            \Log::error("Gagal export Excel Laporan: " . $e->getMessage() . " di " . $e->getFile() . ":" . $e->getLine());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export Excel: ' . $e->getMessage() . ' di baris ' . $e->getLine()
            ], 500);
        }
    }
}
