<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithDrawings;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class KurvaExport implements FromView, ShouldAutoSize, WithDrawings
{
    protected $project, $itemProgress, $chartData, $viewMode, $imagePath;

    public function __construct($project, $itemProgress, $chartData, $viewMode, $imagePath)
    {
        $this->project = $project;
        $this->itemProgress = $itemProgress;
        $this->chartData = $chartData;
        $this->viewMode = $viewMode;
        $this->imagePath = $imagePath;
    }

    public function view(): View
    {
        return view('exports.kurva-s', [
            'project' => $this->project,
            'itemProgress' => $this->itemProgress,
            'chartData' => $this->chartData,
            'viewMode' => $this->viewMode,
            'isExcel' => true
        ]);
    }

    public function drawings()
    {
        $drawings = [];
        if ($this->imagePath && file_exists($this->imagePath)) {
            $drawing = new Drawing();
            $drawing->setName('Kurva S');
            $drawing->setDescription('Grafik Kurva S Proyek');
            $drawing->setPath($this->imagePath);
            $drawing->setHeight(300);
            $drawing->setCoordinates('A4');
            $drawings[] = $drawing;
        }
        return $drawings;
    }
}
