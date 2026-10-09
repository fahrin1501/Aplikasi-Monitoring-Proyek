<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Throwable;

class DailyReportExport implements FromView, WithStyles, WithEvents
{
    protected $report;

    public function __construct($report)
    {
        $this->report = $report;
    }

    public function view(): View
    {
        return view('exports.laporan-harian', [
            'report' => $this->report,
            'isExcel' => true,
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        try {
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            $sheet->getStyle('A1:' . $highestColumn . $highestRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => 'FF000000'],
                    ],
                ],
                'alignment' => [
                    'wrapText' => true,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            // Lebar Kolom
            $sheet->getColumnDimension('A')->setWidth(5);
            $sheet->getColumnDimension('B')->setWidth(16);
            $sheet->getColumnDimension('C')->setWidth(16);
            $sheet->getColumnDimension('D')->setWidth(18);
            $sheet->getColumnDimension('E')->setWidth(11);
            $sheet->getColumnDimension('F')->setWidth(9);

            $sheet->getColumnDimension('G')->setWidth(5);
            $sheet->getColumnDimension('H')->setWidth(14);
            $sheet->getColumnDimension('I')->setWidth(14);
            $sheet->getColumnDimension('J')->setWidth(14);
            $sheet->getColumnDimension('K')->setWidth(9);
            $sheet->getColumnDimension('L')->setWidth(9);
        } catch (Throwable $e) {}

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                try {
                    $sheet = $event->sheet->getDelegate();
                    $highestRow = $sheet->getHighestRow();

                    $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4);
                    $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                    $sheet->getPageSetup()->setFitToWidth(1);
                    $sheet->getPageSetup()->setFitToHeight(0);

                    // Bersihkan border di Area Kop Surat (Baris 1)
                    $sheet->getStyle('A1:L1')->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_NONE);
                    $sheet->getStyle('A1:L1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Rata tengah tanda tangan bawah
                    if ($highestRow > 4) {
                        $sheet->getStyle('A' . ($highestRow - 3) . ':L' . $highestRow)
                              ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }
                } catch (Throwable $e) {}
            },
        ];
    }
}
