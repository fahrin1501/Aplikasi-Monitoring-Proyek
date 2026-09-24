<?php

namespace App\Http\Controllers;

use App\Models\DailyReport;
use App\Models\DailyReportAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DailyReportExport;
use Exception;

class DailyReportController extends Controller
{
    // =================================================================
    // FUNGSI BANTUAN UNTUK AUTO-UPDATE STATUS PROYEK
    // =================================================================
    private function syncProjectStatus($projectId)
    {
        $project = \App\Models\Project::find($projectId);
        if (!$project) return;

        // Cek apakah ada laporan harian di proyek ini
        $hasReports = DailyReport::where('project_id', $projectId)->exists();

        // 1. Jika TIDAK ADA laporan sama sekali -> Kembali ke Persiapan
        if (!$hasReports) {
            if (in_array($project->status, ['Berjalan', 'Selesai'])) {
                $project->update(['status' => 'Persiapan']);
            }
            return;
        }

        // 2. Hitung Grand Total Uang di RAB
        $totalRab = DB::table('rab_items')
            ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
            ->where('rab_categories.project_id', $projectId)
            ->where('rab_items.is_subheader', false)
            ->sum('rab_items.total_harga');

        // 3. Hitung Total Realisasi Uang dari Laporan yang APPROVED (Disetujui PPK)
        $totalRealisasiUang = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->join('rab_items', 'daily_report_activities.rab_item_id', '=', 'rab_items.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->sum(DB::raw('daily_report_activities.volume * rab_items.harga_satuan'));

        if ($totalRab > 0) {
            $progress = ($totalRealisasiUang / $totalRab) * 100;

            // 4. Update Status Sesuai Realisasi Progres
            if ($progress >= 99.99) { // Toleransi koma desimal
                $project->update(['status' => 'Selesai']);
            } else {
                // Jika progres di bawah 100%, ubah dari Persiapan/Selesai menjadi Berjalan
                if (in_array($project->status, ['Persiapan', 'Selesai'])) {
                    $project->update(['status' => 'Berjalan']);
                }
            }
        } else {
            // Jika ada laporan tapi belum ada nilai RAB, otomatiskan jadi Berjalan
            if ($project->status === 'Persiapan') {
                $project->update(['status' => 'Berjalan']);
            }
        }
    }

    // =================================================================
    // 1. TAMPILKAN SEMUA LAPORAN (INDEX)
    // =================================================================
    public function index()
    {
        try {
            $reports = DailyReport::with(['project', 'activities', 'personnels', 'equipments', 'attachments'])
                        ->orderBy('tanggal', 'desc')
                        ->get();

            return response()->json([
                'status' => 'success',
                'data' => $reports
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'System Crash: ' . $e->getMessage()
            ], 500);
        }
    }

    // =================================================================
    // 2. TAMPILKAN 1 LAPORAN SPESIFIK (SHOW)
    // =================================================================
    public function show($id)
    {
        try {
            $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments', 'attachments'])
                        ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $report
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Laporan tidak ditemukan'], 404);
        }
    }

    // =================================================================
    // 3. SIMPAN LAPORAN BARU (STORE)
    // =================================================================
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

            // 1. Simpan Data Induk
            $report = DailyReport::create([
                'project_id' => $projectId,
                'tanggal' => $request->tanggal,
                'minggu_ke' => $request->minggu_ke,
                'pengawas' => $request->pengawas,
                'lokasi' => $request->lokasi,
                'cuaca' => $request->cuaca,
                'kondisi_cuaca' => $request->kondisi_cuaca,
                'status' => 'pending',
            ]);

            $kegiatan = json_decode($request->kegiatan, true) ?? [];
            $personil = json_decode($request->personil, true) ?? [];
            $peralatan = json_decode($request->peralatan, true) ?? [];

            // 3. Simpan Kegiatan
            foreach ($kegiatan as $item) {
                if (!empty($item['uraian'])) {
                    $report->activities()->create([
                        'rab_item_id' => !empty($item['rab_item_id']) ? $item['rab_item_id'] : null,
                        'uraian' => $item['uraian'],
                        'sta_awal' => $item['sta_awal'] ?? null,
                        'sta_akhir' => $item['sta_akhir'] ?? null,
                        'volume' => (isset($item['volume']) && $item['volume'] !== '') ? $item['volume'] : null,
                        'satuan' => !empty($item['satuan']) ? $item['satuan'] : null,
                        'persentase' => (isset($item['persentase']) && $item['persentase'] !== '') ? $item['persentase'] : null,
                    ]);
                }
            }

            // 4. Simpan Personil
            foreach ($personil as $item) {
                if (!empty($item['peran']) && !empty($item['jumlah'])) {
                    $report->personnels()->create([
                        'peran' => $item['peran'],
                        'jumlah' => $item['jumlah'],
                    ]);
                }
            }

            // 5. Simpan Peralatan
            foreach ($peralatan as $item) {
                $namaAlat = $item['nama_alat'] ?? $item['namaAlat'] ?? null;
                if (!empty($namaAlat) && !empty($item['jumlah'])) {
                    $report->equipments()->create([
                        'nama_alat' => $namaAlat,
                        'jumlah' => $item['jumlah'],
                    ]);
                }
            }

            // 6. Simpan Foto
            if ($request->hasFile('foto')) {
                foreach ($request->file('foto') as $file) {
                    $fileName = time() . '_foto_' . str_replace(' ', '_', $file->getClientOriginalName());
                    $path = $file->storeAs('foto_laporan', $fileName, 'public');
                    $report->attachments()->create([
                        'tipe' => 'foto',
                        'nama_file' => $file->getClientOriginalName(),
                        'path_file' => 'storage/' . $path
                    ]);
                }
            }

            // 7. Simpan Lampiran
            if ($request->hasFile('lampiran')) {
                foreach ($request->file('lampiran') as $file) {
                    $fileName = time() . '_lampiran_' . str_replace(' ', '_', $file->getClientOriginalName());
                    $path = $file->storeAs('dokumen_laporan', $fileName, 'public');
                    $report->attachments()->create([
                        'tipe' => 'dokumen',
                        'nama_file' => $file->getClientOriginalName(),
                        'path_file' => 'storage/' . $path
                    ]);
                }
            }

            // AUTO-UPDATE STATUS PROYEK
            $this->syncProjectStatus($projectId);

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Laporan Harian Berhasil Disimpan!']);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    // =================================================================
    // 4. UPDATE LAPORAN (UPDATE)
    // =================================================================
    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $report = DailyReport::findOrFail($id);

            // 1. Update Parent Info
            $report->update([
                'tanggal' => $request->tanggal ?? $report->tanggal,
                'minggu_ke' => $request->minggu_ke ?? $report->minggu_ke, // PENAMBAHAN MINGGU_KE
                'pengawas' => $request->pengawas ?? $report->pengawas,
                'lokasi' => $request->lokasi ?? $report->lokasi,
                'cuaca' => $request->cuaca ?? $report->cuaca,
                'kondisi_cuaca' => $request->kondisi_cuaca ?? $report->kondisi_cuaca,
                'status' => 'pending',
                'verified_at' => null
            ]);

            // 2. Sinkronisasi Kegiatan
            if ($request->has('kegiatan')) {
                $report->activities()->delete();
                $kegiatan = json_decode($request->kegiatan, true) ?? [];
                foreach ($kegiatan as $item) {
                    if (!empty($item['uraian'])) {
                        $report->activities()->create([
                            'rab_item_id' => $item['rab_item_id'] ?? null,
                            'uraian' => $item['uraian'],
                            'sta_awal' => $item['sta_awal'] ?? null,
                            'sta_akhir' => $item['sta_akhir'] ?? null,
                            'volume' => (isset($item['volume']) && $item['volume'] !== '') ? $item['volume'] : null,
                            'satuan' => $item['satuan'] ?? null,
                            'persentase' => (isset($item['persentase']) && $item['persentase'] !== '') ? $item['persentase'] : null, // PENAMBAHAN PERSENTASE
                        ]);
                    }
                }
            }

            // 3. Sinkronisasi Personil
            if ($request->has('personil')) {
                $report->personnels()->delete();
                $personil = json_decode($request->personil, true) ?? [];
                foreach ($personil as $item) {
                    if (!empty($item['peran']) && !empty($item['jumlah'])) {
                        $report->personnels()->create([
                            'peran' => $item['peran'],
                            'jumlah' => $item['jumlah'],
                        ]);
                    }
                }
            }

            // 4. Sinkronisasi Peralatan
            if ($request->has('peralatan')) {
                $report->equipments()->delete();
                $peralatan = json_decode($request->peralatan, true) ?? [];
                foreach ($peralatan as $item) {
                    $namaAlat = $item['nama_alat'] ?? $item['namaAlat'] ?? null;
                    if (!empty($namaAlat) && !empty($item['jumlah'])) {
                        $report->equipments()->create([
                            'nama_alat' => $namaAlat,
                            'jumlah' => $item['jumlah'],
                        ]);
                    }
                }
            }

            // AUTO-UPDATE STATUS PROYEK
            $this->syncProjectStatus($report->project_id);

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Laporan berhasil diperbarui dan status kembali Pending.']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal mengupdate laporan: ' . $e->getMessage()], 500);
        }
    }

    // =================================================================
    // 5. UPLOAD FILE TAMBAHAN SAAT EDIT MODE
    // =================================================================
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

    // =================================================================
    // 6. HAPUS 1 LAMPIRAN SPESIFIK SAAT EDIT MODE
    // =================================================================
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

    // =================================================================
    // 7. HAPUS SELURUH LAPORAN (DESTROY)
    // =================================================================
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            $report = DailyReport::findOrFail($id);
            $projectId = $report->project_id; // Simpan ID Proyek sebelum dihapus

            foreach ($report->attachments as $attachment) {
                $path = str_replace('storage/', '', $attachment->path_file);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            $report->delete();

            // AUTO-UPDATE STATUS PROYEK
            $this->syncProjectStatus($projectId);

            DB::commit();

            return response()->json(['status' => 'success', 'message' => 'Laporan berhasil dihapus secara permanen']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus laporan: ' . $e->getMessage()], 500);
        }
    }

    // =================================================================
    // 8. VERIFIKASI LAPORAN (PPK APPROVAL)
    // =================================================================
    public function verifyReport($id)
    {
        try {
            $report = DailyReport::findOrFail($id);
            $report->update([
                'status' => 'approved',
                'verified_at' => now()
            ]);

            // AUTO-UPDATE STATUS PROYEK (Cek apakah sudah 100% setelah ini disetujui)
            $this->syncProjectStatus($report->project_id);

            return response()->json([
                'status' => 'success',
                'message' => 'Laporan Lapangan berhasil disetujui & diverifikasi!'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal verifikasi laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportPdf($id)
    {
        $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments'])->findOrFail($id);

        $pdf = Pdf::loadView('exports.laporan-harian', compact('report'))->setPaper('a4', 'portrait');

        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $report->project->nama_proyek ?? 'Proyek');
        $fileName = 'Laporan_Harian_' . $report->tanggal . '_' . $safeName . '.pdf';

        return $pdf->download($fileName);
    }

    // =================================================================
    // 10. EXPORT EXCEL
    // =================================================================
    public function exportExcel($id)
    {
        $report = DailyReport::with(['project', 'activities', 'personnels', 'equipments'])->findOrFail($id);

        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $report->project->nama_proyek ?? 'Proyek');
        $fileName = 'Laporan_Harian_' . $report->tanggal . '_' . $safeName . '.xlsx';

        return Excel::download(new DailyReportExport($report), $fileName);
    }
}
