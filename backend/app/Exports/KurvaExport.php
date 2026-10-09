<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Throwable;

class KurvaExport implements FromView, WithDrawings, WithStyles, WithEvents
{
    protected $data;
    protected $imagePath;

    public function __construct(array $data, ?string $imagePath = null)
    {
        $this->data = $data;
        $this->imagePath = $imagePath;
    }

    public function view(): View
    {
        $viewData = $this->data;
        $viewData['isExcel'] = true;
        return view('exports.kurva-s', $viewData);
    }

    public function drawings()
    {
        $drawings = [];
        try {
            if ($this->imagePath && file_exists($this->imagePath) && is_readable($this->imagePath)) {
                $drawing = new Drawing();
                $drawing->setName('Grafik Kurva S');
                $drawing->setDescription('Grafik Realisasi vs Rencana');
                $drawing->setPath($this->imagePath);
                $drawing->setHeight(250);
                $drawing->setCoordinates('B4');
                $drawing->setOffsetX(10);
                $drawings[] = $drawing;
            }
        } catch (Throwable $e) {
            // Abaikan jika gambar gagal dimuat agar file Excel tetap terunduh
        }
        return $drawings;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getColumnDimension('A')->setWidth(14);
        $sheet->getColumnDimension('B')->setWidth(48);
        $sheet->getColumnDimension('C')->setWidth(12);

        $totalWeeks = isset($this->data['localWeeks']) ? count($this->data['localWeeks']) : 0;
        $colIndex = 4;

        for ($i = 0; $i < $totalWeeks; $i++) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
            $sheet->getColumnDimension($colLetter)->setWidth(10);
            $colIndex++;
        }

        $lastColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
        $sheet->getColumnDimension($lastColLetter)->setWidth(16);

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A3);
                $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(0);

                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();

                $sheet->getStyle('A1:' . $highestCol . $highestRow)
                      ->getAlignment()
                      ->setVertical(Alignment::VERTICAL_CENTER);
            },
        ];
    }
}
