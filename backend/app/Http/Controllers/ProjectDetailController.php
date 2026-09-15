<?php

namespace App\Http\Controllers;

use App\Models\ProjectPersonnel;
use App\Models\ProjectDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectDetailController extends Controller
{
    public function storePersonnel(Request $request, $projectId)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'peran' => 'required|string|max:255',
        ]);

        $personnel = ProjectPersonnel::create([
            'project_id' => $projectId,
            'nama' => $validated['nama'],
            'peran' => $validated['peran'],
        ]);

        return response()->json(['status' => 'success', 'data' => $personnel]);
    }

    public function updatePersonnel(Request $request, $id)
    {
        $personnel = ProjectPersonnel::findOrFail($id);
        $personnel->update($request->only(['nama', 'peran']));

        return response()->json(['status' => 'success', 'message' => 'Personel diupdate.']);
    }

    public function destroyPersonnel($id)
    {
        ProjectPersonnel::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Personel dihapus.']);
    }

     public function storeDocument(Request $request, $projectId)
    {
        $request->validate([
            'dokumen_lampiran' => 'required|array',
            'dokumen_lampiran.*' => 'file|mimes:pdf,xlsx,xls,dwg|max:20480',
        ]);

        if ($request->hasFile('dokumen_lampiran')) {
            foreach ($request->file('dokumen_lampiran') as $file) {
                $fileName = time() . '_doc_' . str_replace(' ', '_', $file->getClientOriginalName());

                // PERBAIKAN: Menggunakan disk 'public'
                $filePath = $file->storeAs('dokumen_lampiran', $fileName, 'public');

                $sizeInMB = number_format($file->getSize() / 1048576, 2) . ' MB';

                ProjectDocument::create([
                    'project_id' => $projectId,
                    'nama_file' => $file->getClientOriginalName(),
                    'path_file' => 'storage/' . $filePath, // Path rapi untuk DB
                    'ukuran' => $sizeInMB
                ]);
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Dokumen berhasil diunggah.']);
    }

    public function destroyDocument($id)
    {
        $document = ProjectDocument::findOrFail($id);

        // PERBAIKAN: Hapus dari disk 'public'
        $path = str_replace('storage/', '', $document->path_file);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $document->delete();

        return response()->json(['status' => 'success', 'message' => 'Dokumen berhasil dihapus.']);
    }
}
