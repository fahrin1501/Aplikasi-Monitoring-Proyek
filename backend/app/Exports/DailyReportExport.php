<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

class DailyReportExport implements FromView, ShouldAutoSize, WithStyles, WithEvents
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
        // Berikan garis tepi (border) ke seluruh sel yang terpakai
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . $sheet->getHighestRow())->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['argb' => 'FF000000'],
                ],
            ],
        ]);

        // Atur lebar kolom (agar Excel tidak terlalu rapat)
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('G')->setWidth(5);

        return [];
    }

    // PERBAIKAN: Ubah nama fungsi dari events() menjadi registerEvents()
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                // Set kertas ke Landscape dan faskan ke 1 halaman lebar
                $event->sheet->getDelegate()->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                $event->sheet->getDelegate()->getPageSetup()->setFitToWidth(1);
                $event->sheet->getDelegate()->getPageSetup()->setFitToHeight(0);

                // Hapus border pada area Kop Surat agar terlihat rapi
                $event->sheet->getDelegate()->getStyle('A1:L3')->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE);
            },
        ];
    }
}
