<?php

namespace App\Exports;

use App\Models\Project;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ProjectDetailExport implements FromCollection, WithHeadings, WithStyles, WithEvents
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
        if ($project->personnels && count($project->personnels) > 0) {
            foreach($project->personnels as $p) {
                $personelText .= "• " . $p->nama . " (" . $p->peran . ")\n";
            }
        } else {
            $personelText = "-";
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
            ['Personel Lapangan', trim($personelText)],
            ['Status Proyek', $project->status],
        ]);
    }

    public function headings(): array
    {
        return ['PARAMETER', 'DESKRIPSI / NILAI'];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();

        // 1. Mengatur lebar kolom secara paten
        $sheet->getColumnDimension('A')->setWidth(30);
        $sheet->getColumnDimension('B')->setWidth(85);

        // 2. Wrap text & rata vertikal ke atas agar deskripsi/personel turun ke bawah
        $sheet->getStyle('A1:B' . $highestRow)->getAlignment()->setWrapText(true);
        $sheet->getStyle('A1:B' . $highestRow)->getAlignment()->setVertical(Alignment::VERTICAL_TOP);

        // 3. Tambahkan border tipis agar mirip tabel laporan resmi
        $sheet->getStyle('A1:B' . $highestRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF000000'],
                ],
            ],
        ]);

        return [
            // Styling khusus baris 1 (Header)
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => 'solid', 'color' => ['argb' => 'FF1E293B']], // Warna Slate-800
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ],
            // Styling khusus kolom A agar selalu tebal
            'A' => ['font' => ['bold' => true]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                // 4. TRIK RAHASIA EXCEL: Memaksa tinggi baris menyesuaikan otomatis
                for ($row = 1; $row <= $highestRow; $row++) {
                    $sheet->getRowDimension($row)->setRowHeight(-1);
                }
            },
        ];
    }
}
