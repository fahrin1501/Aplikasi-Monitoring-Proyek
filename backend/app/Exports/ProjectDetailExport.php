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
            ['Kode Kontrak', $project->kode_kontrak],
            ['Nilai Kontrak', 'Rp ' . number_format($project->nilai_kontrak, 0, ',', '.')],
            ['Sumber Dana', $project->sumber_dana ?? '-'],
            ['Tahun Anggaran', $project->tahun_anggaran ?? '-'],
            ['Tanggal Mulai', $project->tanggal_mulai],
            ['Tanggal Selesai', $project->tanggal_selesai],
            ['Waktu Pelaksanaan', $project->waktu_pelaksanaan ?? '-'],
            ['Lokasi', $project->lokasi_wilayah ?? '-'],
            ['PPK / Owner', $project->ppk ?? '-'],
            ['Kontraktor', $project->kontraktor ?? '-'],
            ['Konsultan', $project->konsultan ?? '-'],
            ['Personel Lapangan', $personelText ?: '-'],
            ['Status', $project->status],
        ]);
    }

    public function headings(): array
    {
        return ['PARAMETER', 'DESKRIPSI / NILAI'];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(60);
        $sheet->getStyle('B')->getAlignment()->setWrapText(true);

        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['argb' => 'FF000000']]],
            'A' => ['font' => ['bold' => true]],
        ];
    }
}
