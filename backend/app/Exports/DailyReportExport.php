<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
// PERHATIAN: ShouldAutoSize DIBUANG agar tidak bentrok dengan Colspan HTML
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class DailyReportExport implements FromView, WithStyles, WithEvents
{
    protected $report;

    public function __construct($report)
    {
        $this->report = $report;
    }

    public function view(): View
    {
        return view('exports.laporan-harian', ['report' => $this->report]);
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // 1. Seting Dasar: Border dan Wrap Text
        $sheet->getStyle('A1:' . $highestColumn . $highestRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF000000'],
                ],
            ],
            'alignment' => [
                'wrapText' => true, // Wajib nyala agar teks bisa turun ke bawah
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // 2. LEBAR KOLOM MANUAL (Total Presisi Untuk Kertas A4 Landscape)
        // Bagian Kiri (Pekerjaan & Personil)
        $sheet->getColumnDimension('A')->setWidth(5);   // No
        $sheet->getColumnDimension('B')->setWidth(16);  // Uraian (Merge B & C)
        $sheet->getColumnDimension('C')->setWidth(16);
        $sheet->getColumnDimension('D')->setWidth(18);  // STA Awal - Akhir
        $sheet->getColumnDimension('E')->setWidth(11);  // Volume & Satuan
        $sheet->getColumnDimension('F')->setWidth(9);   // Bobot %

        // Bagian Kanan (Alat & Cuaca)
        $sheet->getColumnDimension('G')->setWidth(5);   // No
        $sheet->getColumnDimension('H')->setWidth(14);  // Nama Alat (Merge H, I, J)
        $sheet->getColumnDimension('I')->setWidth(14);
        $sheet->getColumnDimension('J')->setWidth(14);
        $sheet->getColumnDimension('K')->setWidth(9);   // Jumlah Alat (Merge K & L)
        $sheet->getColumnDimension('L')->setWidth(9);

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                // 1. Setup Kertas Halaman Print
                $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4);
                $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(0);

                // 2. Membersihkan Border di Area Kop Surat (Baris 1 sampai 4)
                $sheet->getStyle('A1:L4')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_NONE);
                $sheet->getStyle('A1:L4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // 3. Rata Tengah Tanda Tangan (3 Baris Terbawah)
                $sheet->getStyle('A' . ($highestRow - 3) . ':L' . $highestRow)
                      ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // =========================================================================
                // 4. TRIK RAHASIA: MEMAKSA AUTO-FIT ROW HEIGHT UNTUK TEKS YANG DI WRAP
                // =========================================================================
                for ($row = 1; $row <= $highestRow; $row++) {
                    // Angka -1 akan memberitahu Excel untuk menghitung ulang tinggi baris
                    // berdasarkan seberapa panjang teks di dalamnya.
                    $sheet->getRowDimension($row)->setRowHeight(-1);
                }
            },
        ];
    }
}
