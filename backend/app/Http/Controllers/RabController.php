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
use Illuminate\Support\Facades\DB; // WAJIB IMPORT DB

class RabController extends Controller
{
    public function index($projectId)
    {
        $rabData = RabCategory::with('items')
            ->where('project_id', $projectId)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rabData
        ]);
    }

    public function storeCategory(Request $request, $projectId)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);

        $category = RabCategory::create([
            'project_id' => $projectId,
            'kode_divisi' => $request->kode_divisi,
            'nama_kategori' => $request->nama_kategori
        ]);

        return response()->json(['status' => 'success', 'data' => $category]);
    }

    public function updateCategory(Request $request, $id)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);

        $category = RabCategory::findOrFail($id);
        $category->update([
            'kode_divisi' => $request->kode_divisi,
            'nama_kategori' => $request->nama_kategori
        ]);

        return response()->json(['status' => 'success', 'message' => 'Kategori berhasil diupdate.']);
    }

    public function destroyCategory($id)
    {
        RabCategory::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Kategori dihapus.']);
    }

    public function storeItem(Request $request, $categoryId)
    {
        $validated = $request->validate([
            'uraian_pekerjaan' => 'required|string|max:255',
            'is_subheader' => 'boolean',
            'kode_pekerjaan' => 'nullable|string|max:100',
            'satuan' => 'nullable|string|max:50',
            'volume' => 'nullable|numeric',
            'harga_satuan' => 'nullable|numeric',
        ]);

        $validated['rab_category_id'] = $categoryId;
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
            'kode_pekerjaan' => 'nullable|string|max:100',
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
        $rabs = \App\Models\RabCategory::with('items')->where('project_id', $id)->get();
        $reports = DailyReport::with('activities')->where('project_id', $id)->where('status', 'approved')->get();

        $realisasiMap = [];
        foreach ($reports as $report) {
            foreach ($report->activities as $act) {
                if ($act->rab_item_id) {
                    if (!isset($realisasiMap[$act->rab_item_id])) {
                        $realisasiMap[$act->rab_item_id] = [
                            'vol' => 0,
                            'persen_kumulatif' => 0,
                            'has_persen' => false
                        ];
                    }

                    $realisasiMap[$act->rab_item_id]['vol'] += (float)$act->volume;

                    if (!is_null($act->persentase)) {
                        $realisasiMap[$act->rab_item_id]['persen_kumulatif'] += (float)$act->persentase;
                        $realisasiMap[$act->rab_item_id]['has_persen'] = true;
                    }
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
                    $item->actualVol = $realisasiMap[$item->id]['vol'] ?? 0;

                    $hasPersen = $realisasiMap[$item->id]['has_persen'] ?? false;

                    if ($hasPersen) {
                        $persenData = $realisasiMap[$item->id]['persen_kumulatif'] ?? 0;
                        $item->actualTotal = ($persenData / 100) * $item->total_harga;
                    } else {
                        $item->actualTotal = $item->actualVol * $item->harga_satuan;
                    }

                    $item->rencanaTotalPPN = $item->total_harga + ($item->total_harga * 0.11);
                    $item->actualTotalPPN = $item->actualTotal + ($item->actualTotal * 0.11);

                    $divRencana += $item->total_harga;
                    $divRealisasi += $item->actualTotal;
                }
            }
            $divisi->totalRencana = $divRencana;
            $divisi->totalRealisasi = $divRealisasi;

            $divisi->totalRencanaPPN = $divRencana + ($divRencana * 0.11);
            $divisi->totalRealisasiPPN = $divRealisasi + ($divRealisasi * 0.11);

            $grandTotalRencana += $divRencana;
            $grandTotalRealisasi += $divRealisasi;
        }

        $grandTotalRencanaPPN = $grandTotalRencana + ($grandTotalRencana * 0.11);
        $grandTotalRealisasiPPN = $grandTotalRealisasi + ($grandTotalRealisasi * 0.11);

        return compact(
            'project', 'rabs',
            'grandTotalRencana', 'grandTotalRealisasi',
            'grandTotalRencanaPPN', 'grandTotalRealisasiPPN'
        );
    }

    public function exportRabPdf($id)
    {
        $data = $this->exportRabData($id);
        $pdf = Pdf::loadView('exports.rab', $data)->setPaper('a4', 'landscape');

        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $data['project']->nama_proyek);
        $fileName = $safeName . ' - RAB.pdf';

        return $pdf->download($fileName);
    }

    public function exportRabExcel($id)
    {
        $data = $this->exportRabData($id);
        $data['isExcel'] = true;

        $safeName = preg_replace('/[^A-Za-z0-9\-]/', '_', $data['project']->nama_proyek);
        $fileName = $safeName . ' - RAB.xlsx';

        return Excel::download(new RabExport($data), $fileName);
    }

    // =========================================================================
    // OPTIMASI: Transaksi Database & Bulk Insert untuk Kecepatan Ekstrem
    // =========================================================================
    public function importRAB(Request $request, $projectId)
    {
        $request->validate(['file' => 'required|mimes:xlsx,xls']);

        try {
            $sheets = Excel::toArray(new \stdClass(), $request->file('file'));
            $rows = $sheets[0];

            DB::beginTransaction(); // 1. BUKA PINTU TRANSAKSI (Mencegah Auto-Commit per baris)

            $currentCategory = null;
            $itemsToInsert = [];    // 2. KUMPULKAN DATA KE ARRAY
            $now = now();

            for ($i = 2; $i < count($rows); $i++) {
                $row = $rows[$i];

                $kode = trim($row[0] ?? '');
                $uraian = trim($row[1] ?? '');
                $satuan = trim($row[2] ?? '');
                $volume = $row[3] ?? 0;
                $hargaSatuan = $row[4] ?? 0;

                if (empty($uraian) && !empty($kode) && (empty($satuan) || is_numeric($satuan) || is_string($satuan))) {
                    $uraian = $kode;
                    $kode = null;
                    $satuan = trim($row[1] ?? '');
                    $volume = $row[2] ?? 0;
                    $hargaSatuan = $row[3] ?? 0;
                }

                if (empty($uraian)) continue;

                if (str_starts_with(strtoupper($uraian), 'SUBTOTAL') || strtoupper($uraian) === 'GRAND TOTAL') {
                    continue;
                }

                // Ganti Kategori (Divisi)
                if (str_starts_with(strtoupper($uraian), 'DIVISI') || str_starts_with(strtoupper($uraian), 'DEVISI')) {
                    // Jika ada tumpukan item sebelumnya, simpan dulu (Bulk Insert)
                    if (!empty($itemsToInsert)) {
                        foreach (array_chunk($itemsToInsert, 500) as $chunk) {
                            RabItem::insert($chunk);
                        }
                        $itemsToInsert = []; // Kosongkan keranjang
                    }

                    $currentCategory = RabCategory::create([
                        'project_id' => $projectId,
                        'kode_divisi' => $kode,
                        'nama_kategori' => $uraian
                    ]);
                    continue;
                }

                if (!$currentCategory) {
                    $currentCategory = RabCategory::create([
                        'project_id' => $projectId,
                        'kode_divisi' => null,
                        'nama_kategori' => 'DIVISI UMUM (Otomatis)'
                    ]);
                }

                // Masukkan ke Keranjang Array (Belum menyentuh Database)
                if (empty($satuan)) {
                    $itemsToInsert[] = [
                        'rab_category_id' => $currentCategory->id,
                        'kode_pekerjaan' => $kode,
                        'uraian_pekerjaan' => $uraian,
                        'satuan' => null,
                        'volume' => null,
                        'harga_satuan' => null,
                        'total_harga' => 0,
                        'is_subheader' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                } else {
                    $hargaBersih = is_numeric($hargaSatuan) ? (float) $hargaSatuan : (float) preg_replace('/[^0-9]/', '', $hargaSatuan);
                    $volumeBersih = is_numeric($volume) ? (float) $volume : (float) str_replace(',', '.', $volume);

                    $itemsToInsert[] = [
                        'rab_category_id' => $currentCategory->id,
                        'kode_pekerjaan' => $kode,
                        'uraian_pekerjaan' => $uraian,
                        'satuan' => $satuan,
                        'volume' => $volumeBersih,
                        'harga_satuan' => $hargaBersih,
                        'total_harga' => $volumeBersih * $hargaBersih,
                        'is_subheader' => false,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // 3. Simpan Sisa Keranjang Terakhir (Bulk Insert)
            if (!empty($itemsToInsert)) {
                foreach (array_chunk($itemsToInsert, 500) as $chunk) {
                    RabItem::insert($chunk);
                }
            }

            DB::commit(); // 4. TUTUP DAN SIMPAN SELURUH DATA KE MYSQL SEKALI JALAN

            return response()->json(['status' => 'success', 'message' => 'Data RAB berhasil diimpor dengan sangat cepat.']);

        } catch (\Exception $e) {
            DB::rollBack(); // Batalkan semua jika ada error
            return response()->json(['status' => 'error', 'message' => 'Gagal mengimpor RAB: ' . $e->getMessage()], 500);
        }
    }
}
