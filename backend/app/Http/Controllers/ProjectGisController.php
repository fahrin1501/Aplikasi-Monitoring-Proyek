<?php

namespace App\Http\Controllers;

use App\Models\ProjectGisDocument;
use App\Models\ProjectGisZone;
use App\Models\DailyReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectGisController extends Controller
{
    public function storeDocument(Request $request, $projectId)
    {
        $request->validate([
            'dokumen_gis' => 'required|array',
            'dokumen_gis.*' => 'file|mimes:pdf,dwg,kml,kmz,zip,rar,xlsx|max:51200', // Support format pemetaan (Max 50MB)
        ]);

        if ($request->hasFile('dokumen_gis')) {
            foreach ($request->file('dokumen_gis') as $file) {
                $fileName = time() . '_gis_' . str_replace(' ', '_', $file->getClientOriginalName());
                $filePath = $file->storeAs('dokumen_gis', $fileName, 'public');
                $sizeInMB = number_format($file->getSize() / 1048576, 2) . ' MB';

                ProjectGisDocument::create([
                    'project_id' => $projectId,
                    'nama_file' => $file->getClientOriginalName(),
                    'path_file' => 'storage/' . $filePath,
                    'ukuran' => $sizeInMB
                ]);
            }
        }
        return response()->json(['status' => 'success']);
    }

    public function destroyDocument($id)
    {
        $document = ProjectGisDocument::findOrFail($id);
        $path = str_replace('storage/', '', $document->path_file);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
        $document->delete();
        return response()->json(['status' => 'success']);
    }

    public function index($projectId)
    {
        $zones = ProjectGisZone::where('project_id', $projectId)->get();
        return response()->json([
            'status' => 'success',
            'data' => $zones
        ]);
    }

    // 2. Simpan Zona Baru (POST)
    public function store(Request $request, $projectId)
    {
        // Validasi bebas disesuaikan
        $zone = ProjectGisZone::create([
            'project_id' => $projectId,
            'koordinat_awal' => $request->koordinat_awal,
            'koordinat_akhir' => $request->koordinat_akhir,
            'status_lahan' => $request->status_lahan,
            'geojson_data' => $request->geojson_data,
        ]);

        return response()->json(['status' => 'success', 'data' => $zone]);
    }

    public function update(Request $request, $projectId, $id)
    {
        $zone = ProjectGisZone::where('project_id', $projectId)->findOrFail($id);

        $zone->update($request->only([
            'koordinat_awal', 'koordinat_akhir',
            'status_lahan', 'geojson_data'
        ]));

        return response()->json(['status' => 'success', 'data' => $zone]);
    }

    // 3. Edit Zona Spesifik (PUT)

    // 4. Hapus Zona Spesifik (DELETE)
    public function destroy($projectId, $id)
    {
        $zone = ProjectGisZone::where('project_id', $projectId)->findOrFail($id);
        $zone->delete();

        return response()->json(['status' => 'success', 'message' => 'Zona berhasil dihapus']);
    }

    // =================================================================
    // 11. AMBIL SEMUA LAPORAN BERDASARKAN ID PROYEK (GET)
    // =================================================================
    public function getByProject($projectId)
    {
        try {
            // Tarik laporan khusus untuk proyek ini saja beserta relasi kegiatannya
            $reports = DailyReport::with(['project', 'activities', 'personnels', 'equipments', 'attachments'])
                        ->where('project_id', $projectId)
                        ->orderBy('tanggal', 'asc')
                        ->get();

            return response()->json([
                'status' => 'success',
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menarik data laporan proyek: ' . $e->getMessage()
            ], 500);
        }
    }
}
