<?php

namespace App\Exports;

use App\Models\Project;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProjectDetailExport implements FromCollection, WithHeadings, WithStyles
{
    protected $id;

    public function __construct($id)
    {
        $this->id = $id;
    }

    public function collection()
    {
        $project = Project::with('personnels')->findOrFail($this->id);

        $personelText = "";
        foreach($project->personnels as $p) {
            $personelText .= $p->nama . " (" . $p->peran . ")\n";
        }

        // Menyusun baris data secara vertikal agar enak dibaca di Excel
        return collect([
            ['Nama Proyek', $project->nama_proyek],
            ['Kategori / Bidang', $project->kategori ?? 'Belum Ditentukan'],
            ['No. Kontrak Konsultan', $project->kode_kontrak ?? '-'],
            ['No. Kontrak Kontraktor', $project->nomor_kontrak_kontraktor ?? '-'],
            ['Nilai Kontrak (Pagu)', 'Rp ' . number_format($project->nilai_kontrak, 0, ',', '.')],
            ['Sumber Dana', $project->sumber_dana ?? '-'],
            ['Tahun Anggaran', $project->tahun_anggaran ?? '-'],
            ['Tanggal Mulai', $project->tanggal_mulai],
            ['Tanggal Selesai', $project->tanggal_selesai ?? '-'],
            ['Waktu Pelaksanaan', $project->waktu_pelaksanaan ?? '-'],
            ['Masa Pemeliharaan', $project->masa_pemeliharaan ?? '-'],
            ['Lokasi Wilayah', $project->lokasi_wilayah ?? '-'],
            ['Deskripsi / Lingkup Pekerjaan', $project->deskripsi ?? '-'],
            ['PPK / Owner', $project->ppk ?? '-'],
            ['Kontraktor Pelaksana', $project->kontraktor ?? '-'],
            ['Konsultan Pengawas', $project->konsultan ?? '-'],
            ['Personel Lapangan', $personelText ?: '-'],
            ['Status Proyek', $project->status],
        ]);
    }

    public function headings(): array
    {
        return ['PARAMETER', 'DESKRIPSI / NILAI'];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(70);
        $sheet->getStyle('B')->getAlignment()->setWrapText(true);

        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['argb' => 'FF000000']]],
            'A' => ['font' => ['bold' => true]],
        ];
    }
}
