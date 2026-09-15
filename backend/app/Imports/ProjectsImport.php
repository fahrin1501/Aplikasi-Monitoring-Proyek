<?php

namespace App\Imports;

use App\Models\Project;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use PhpOffice\PhpSpreadsheet\Shared\Date; // Library wajib untuk baca tanggal Excel

class ProjectsImport implements ToCollection
{
    public function collection(Collection $rows)
    {
        // 1. Siapkan nilai default agar terhindar dari Error Database (Constraint Violation)
        $dataProyek = [
            'status'            => 'Persiapan',
            'kategori'          => 'Belum Ditentukan', // Mencegah error jika kategori wajib
            'deskripsi'         => 'Diimpor dari Excel', // Mencegah error jika deskripsi wajib
            'nama_proyek'       => null,
            'kode_kontrak'      => '-',
            'nilai_kontrak'     => 0,
            'tanggal_mulai'     => null,
            'tanggal_selesai'   => null,
        ];

        // 2. Looping setiap baris di file Excel
        foreach ($rows as $row) {
            $parameter = strtolower(trim($row[0] ?? ''));
            $nilai = $row[1] ?? null;

            if (empty($parameter) || is_null($nilai)) {
                continue;
            }

            // 3. Pencocokan Parameter (Kiri ke Kanan)
            if (str_contains($parameter, 'nama proyek')) {
                $dataProyek['nama_proyek'] = $nilai;
            }
            elseif (str_contains($parameter, 'kode kontrak') || str_contains($parameter, 'nomor kontrak')) {
                $dataProyek['kode_kontrak'] = $nilai;
            }
            elseif (str_contains($parameter, 'nilai kontrak') || str_contains($parameter, 'pagu')) {
                // Bersihkan "Rp 2.500.000.000" menjadi angka murni "2500000000"
                $dataProyek['nilai_kontrak'] = (float) preg_replace('/[^0-9]/', '', $nilai);
            }
            elseif (str_contains($parameter, 'sumber dana')) {
                $dataProyek['sumber_dana'] = $nilai;
            }
            elseif (str_contains($parameter, 'tahun anggaran')) {
                $dataProyek['tahun_anggaran'] = $nilai;
            }
            elseif (str_contains($parameter, 'tanggal mulai')) {
                $dataProyek['tanggal_mulai'] = $this->formatDate($nilai);
            }
            elseif (str_contains($parameter, 'tanggal selesai')) {
                $dataProyek['tanggal_selesai'] = $this->formatDate($nilai);
            }
            elseif (str_contains($parameter, 'waktu pelaksanaan')) {
                $dataProyek['waktu_pelaksanaan'] = $nilai;
            }
            elseif (str_contains($parameter, 'masa pemeliharaan')) {
                $dataProyek['masa_pemeliharaan'] = $nilai;
            }
            elseif (str_contains($parameter, 'lokasi') || str_contains($parameter, 'wilayah')) {
                $dataProyek['lokasi_wilayah'] = $nilai;
            }
            elseif (str_contains($parameter, 'ppk') || str_contains($parameter, 'owner')) {
                $dataProyek['ppk'] = $nilai;
            }
            elseif (str_contains($parameter, 'kontraktor') || str_contains($parameter, 'pelaksana')) {
                $dataProyek['kontraktor'] = $nilai;
            }
            elseif (str_contains($parameter, 'konsultan') || str_contains($parameter, 'pengawas')) {
                $dataProyek['konsultan'] = $nilai;
            }
        }

        // 4. Jika array berhasil menangkap nama proyek, simpan ke database
        if (!empty($dataProyek['nama_proyek'])) {
            Project::create($dataProyek);
        }
    }

    // Fungsi khusus untuk membaca tanggal secara aman
    private function formatDate($value)
    {
        if (empty($value)) return null;

        // Jika formatnya angka (Serial Date Excel, misalnya 44210)
        if (is_numeric($value)) {
            return Date::excelToDateTimeObject($value)->format('Y-m-d');
        }

        // Jika formatnya sudah teks tanggal (DD/MM/YYYY atau YYYY-MM-DD)
        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }
}
