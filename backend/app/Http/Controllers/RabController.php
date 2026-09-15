<?php

namespace App\Http\Controllers;

use App\Models\RabCategory;
use App\Models\RabItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RabExport;
use App\Models\DailyReport;
use App\Models\Project;

class RabController extends Controller
{
    // --- 1. MENAMPILKAN SELURUH DATA RAB PER PROYEK ---
    public function index($projectId)
    {
        // Ambil semua kategori di proyek ini beserta item di dalamnya
        $rabData = RabCategory::with('items')
            ->where('project_id', $projectId)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rabData
        ]);
    }

    // ==========================================
    // CRUD UNTUK KATEGORI / DIVISI (MERGED ROW)
    // ==========================================

    public function storeCategory(Request $request, $projectId)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);

        $category = RabCategory::create([
            'project_id' => $projectId,
            'nama_kategori' => $request->nama_kategori
        ]);

        return response()->json(['status' => 'success', 'data' => $category]);
    }

    public function updateCategory(Request $request, $id)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);

        $category = RabCategory::findOrFail($id);
        $category->update(['nama_kategori' => $request->nama_kategori]);

        return response()->json(['status' => 'success', 'message' => 'Kategori berhasil diupdate.']);
    }

    public function destroyCategory($id)
    {
        // Berkat onDelete('cascade'), item di dalamnya akan otomatis ikut terhapus!
        RabCategory::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Kategori dihapus.']);
    }

    // ==========================================
    // CRUD UNTUK ITEM PEKERJAAN (BARIS KECIL)
    // ==========================================

    public function storeItem(Request $request, $categoryId)
    {
        $validated = $request->validate([
            'uraian_pekerjaan' => 'required|string|max:255',
            'is_subheader' => 'boolean',
            'satuan' => 'nullable|string|max:50',
            'volume' => 'nullable|numeric',
            'harga_satuan' => 'nullable|numeric',
        ]);

        $validated['rab_category_id'] = $categoryId;

        // Jika dia sub-header, total harganya 0. Jika bukan, kalikan volume * harga.
        $isSubheader = filter_var($request->is_subheader, FILTER_VALIDATE_BOOLEAN);
        if ($isSubheader) {
            $validated['total_harga'] = 0;
            $validated['volume'] = null;
            $validated['harga_satuan'] = null;
        } else {
            $validated['total_harga'] = ($validated['volume'] ?? 0) * ($validated['harga_satuan'] ?? 0);
        }

        $item = RabItem::create($validated);
        return response()->json(['status' => 'success', 'data' => $item]);
    }

    public function updateItem(Request $request, $id)
    {
        $validated = $request->validate([
            'uraian_pekerjaan' => 'required|string|max:255',
            'is_subheader' => 'boolean',
            'satuan' => 'nullable|string|max:50',
            'volume' => 'nullable|numeric',
            'harga_satuan' => 'nullable|numeric',
        ]);

        $isSubheader = filter_var($request->is_subheader, FILTER_VALIDATE_BOOLEAN);
        if ($isSubheader) {
            $validated['total_harga'] = 0;
            $validated['volume'] = null;
            $validated['harga_satuan'] = null;
        } else {
            $validated['total_harga'] = ($validated['volume'] ?? 0) * ($validated['harga_satuan'] ?? 0);
        }

        $item = RabItem::findOrFail($id);
        $item->update($validated);

        return response()->json(['status' => 'success', 'message' => 'Diupdate.']);
    }

    public function destroyItem($id)
    {
        RabItem::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Item pekerjaan dihapus.']);
    }

    public function exportRabData($id)
    {
        $project = Project::findOrFail($id);

        // Ambil kategori RAB beserta items nya
        // Sesuaikan 'RabCategory' dengan nama Model Kategori Divisi Anda
        $rabs = \App\Models\RabCategory::with('items')->where('project_id', $id)->get();

        // Ambil Realisasi
        $reports = DailyReport::with('activities')->where('project_id', $id)->where('status', 'approved')->get();

        $realisasiMap = [];
        foreach ($reports as $report) {
            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {
                    if (!isset($realisasiMap[$act->rab_item_id])) {
                        $realisasiMap[$act->rab_item_id] = 0;
                    }
                    $realisasiMap[$act->rab_item_id] += (float)$act->volume;
                }
            }
        }

        $grandTotalRencana = 0;
        $grandTotalRealisasi = 0;

        foreach ($rabs as $divisi) {
            $divRencana = 0;
            $divRealisasi = 0;
            foreach ($divisi->items as $item) {
                if (!$item->is_subheader) {
                    $item->actualVol = $realisasiMap[$item->id] ?? 0;
                    $item->actualTotal = $item->actualVol * $item->harga_satuan;

                    $divRencana += $item->total_harga;
                    $divRealisasi += $item->actualTotal;
                }
            }
            $divisi->totalRencana = $divRencana;
            $divisi->totalRealisasi = $divRealisasi;

            $grandTotalRencana += $divRencana;
            $grandTotalRealisasi += $divRealisasi;
        }

        return compact('project', 'rabs', 'grandTotalRencana', 'grandTotalRealisasi');
    }

    public function exportRabPdf($id)
    {
        $data = $this->exportRabData($id);
        $pdf = Pdf::loadView('exports.rab', $data)->setPaper('a4', 'landscape');

        // PERBAIKAN: Cukup panggil nama_proyek saja (karena itu adalah string teks)
        // Boleh kita bersihkan spasi ekstra atau karakter aneh agar aman didownload
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $data['project']->nama_proyek);
        $fileName = $safeName . ' - RAB.pdf';

        return $pdf->download($fileName);
    }

    public function exportRabExcel($id)
    {
        $data = $this->exportRabData($id);

        // PERBAIKAN: Sama seperti PDF
        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $data['project']->nama_proyek);
        $fileName = $safeName . ' - RAB.xlsx';

        return Excel::download(new RabExport($data), $fileName);
    }

        public function importRAB(Request $request, $projectId)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls'
        ]);

        try {
            $sheets = Excel::toArray(new \stdClass(), $request->file('file'));
            $rows = $sheets[0]; // Ambil data dari sheet pertama

            $currentCategory = null;

            // Kita mulai dari index 2 untuk melewati baris header tabel Excel
            for ($i = 2; $i < count($rows); $i++) {
                $row = $rows[$i];

                $uraian = trim($row[0] ?? '');
                $satuan = trim($row[1] ?? '');
                $volume = $row[2] ?? 0;
                $hargaSatuan = $row[3] ?? 0;

                if (empty($uraian)) continue;

                // 1. Abaikan baris SUBTOTAL dan GRAND TOTAL (Karena React menghitungnya otomatis)
                if (str_starts_with(strtoupper($uraian), 'SUBTOTAL') || strtoupper($uraian) === 'GRAND TOTAL') {
                    continue;
                }

                // 2. Deteksi DIVISI (Kategori): Cari teks dengan awalan "DIVISI" atau "DEVISI"
                if (str_starts_with(strtoupper($uraian), 'DIVISI') || str_starts_with(strtoupper($uraian), 'DEVISI')) {
                    $currentCategory = RabCategory::create([
                        'project_id' => $projectId,
                        'nama_kategori' => $uraian
                    ]);
                    continue;
                }

                // Pengaman: Jika ada baris tapi belum ada divisi, buatkan Divisi Umum
                if (!$currentCategory) {
                    $currentCategory = RabCategory::create([
                        'project_id' => $projectId,
                        'nama_kategori' => 'DIVISI UMUM (Otomatis)'
                    ]);
                }

                // 3. Deteksi SUB-HEADER vs ITEM
               if (empty($satuan)) {
                    RabItem::create([
                        'rab_category_id' => $currentCategory->id,
                        'uraian_pekerjaan' => $uraian,
                        'is_subheader' => true
                    ]);
                } else {
                    // Ini berarti Item Pekerjaan murni. Bersihkan format Rp. / titik pada harga
                    $hargaBersih = (float) preg_replace('/[^0-9]/', '', $hargaSatuan);
                    $volumeBersih = (float) $volume; // Pastikan volume menjadi angka

                    RabItem::create([
                        'rab_category_id' => $currentCategory->id,
                        'uraian_pekerjaan' => $uraian,
                        'satuan' => $satuan,
                        'volume' => $volumeBersih,
                        'harga_satuan' => $hargaBersih,
                        'total_harga' => $volumeBersih * $hargaBersih, // <--- TAMBAHKAN BARIS INI (Kalkulasi Otomatis)
                        'is_subheader' => false
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Data RAB berhasil diimpor dengan rapi.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengimpor RAB: ' . $e->getMessage()
            ], 500);
        }
    }
}
