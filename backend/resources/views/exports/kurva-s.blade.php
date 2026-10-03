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
use PhpOffice\PhpSpreadsheet\Style\Border;

class KurvaExport implements FromView, WithDrawings, WithStyles, WithEvents
{
    protected $data, $imagePath;

    public function __construct($data, $imagePath)
    {
        $this->data = $data;
        $this->imagePath = $imagePath;
    }

    public function view(): View
    {
        $this->data['isExcel'] = true;
        return view('exports.kurva-s', $this->data);
    }

    public function drawings()
    {
        $drawings = [];
        if ($this->imagePath && file_exists($this->imagePath)) {
            $drawing = new Drawing();
            $drawing->setName('Kurva S');
            $drawing->setDescription('Grafik Kurva S Proyek');
            $drawing->setPath($this->imagePath);
            $drawing->setHeight(320); // Tinggi grafik
            $drawing->setCoordinates('B4'); // Diambil pada baris ke-4 agar rapi
            $drawing->setOffsetX(30);
            $drawings[] = $drawing;
        }
        return $drawings;
    }

    public function styles(Worksheet $sheet)
    {
        // 1. Tentukan Lebar Kolom Dasar (Kiri)
        $sheet->getColumnDimension('A')->setWidth(15); // Kode Pekerjaan
        $sheet->getColumnDimension('B')->setWidth(50); // Uraian Pekerjaan
        $sheet->getColumnDimension('C')->setWidth(10); // Bobot

        // 2. Loop Kolom Mingguan Dinamis (M-1 dst) mulai dari Kolom D
        $totalWeeks = count($this->data['localWeeks']);
        $colIndex = 4; // Kolom ke-4 adalah D
        for ($i = 0; $i < $totalWeeks; $i++) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
            $sheet->getColumnDimension($columnLetter)->setWidth(8); // Lebar setiap kolom minggu
            $colIndex++;
        }

        // 3. Kolom Paling Kanan (Kumulatif)
        $lastColumnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
        $sheet->getColumnDimension($lastColumnLetter)->setWidth(15);

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Set kertas ke Landscape A3 karena tabel memanjang ke samping
                $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A3);
                $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(0);

                // Ratakan Vertikal Tabel
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle('A20:' . $highestCol . $highestRow)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                $sheet->getStyle('A20:' . $highestCol . $highestRow)->getAlignment()->setWrapText(true);
            },
        ];
    }
}
