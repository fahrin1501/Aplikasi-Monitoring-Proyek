<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    // Mengambil Data Perusahaan
    public function show()
    {
        $profile = CompanyProfile::first();

        // Jika belum ada data sama sekali, buat data default otomatis
        if (!$profile) {
            $profile = CompanyProfile::create([
                'name' => 'CONS-MONITORING',
                'subtitle' => 'Consultant System',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $profile
        ]);
    }

    // Mengupdate Data Perusahaan (Gunakan POST karena mengandung File Gambar)
    public function update(Request $request)
    {
        $profile = CompanyProfile::first();

        $request->validate([
            'name' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048' // Max 2MB
        ]);

        $dataUpdate = [
            'name' => $request->name,
            'subtitle' => $request->subtitle,
        ];

        // Cek jika ada file logo yang diunggah
        if ($request->hasFile('logo')) {
            // Hapus logo lama dari server jika ada
            if ($profile->logo_path) {
                $oldPath = str_replace('storage/', '', $profile->logo_path);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Simpan logo baru
            $file = $request->file('logo');
            $fileName = time() . '_logo_' . str_replace(' ', '_', $file->getClientOriginalName());
            $path = $file->storeAs('company_logo', $fileName, 'public');

            $dataUpdate['logo_path'] = 'storage/' . $path;
        }

        $profile->update($dataUpdate);

        return response()->json([
            'status' => 'success',
            'message' => 'Profil Perusahaan berhasil diperbarui!',
            'data' => $profile
        ]);
    }
}
