<?php

namespace App\Services;

use App\Models\RabItem;
use Illuminate\Support\Facades\DB;

class ProjectProgressService
{
    /**
     * Menghitung Grand Total Nilai RAB (100% Proyek)
     */
    public function calculateTotalProjectValue($projectId)
    {
        return DB::table('rab_items')
            ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
            ->where('rab_categories.project_id', $projectId)
            ->where('rab_items.is_subheader', false)
            ->sum('rab_items.total_harga');
    }

    /**
     * Menghitung Persentase Progres Harian berdasarkan Volume
     */
    public function calculateItemProgress($rabItemId, $volumeHarian, $totalProjectValue)
    {
        // Jika tidak ada data, item manual, atau RAB kosong, kembalikan 0
        if (!$rabItemId || $totalProjectValue <= 0 || $volumeHarian <= 0) {
            return 0;
        }

        $rabItem = RabItem::find($rabItemId);
        if (!$rabItem || $rabItem->volume <= 0) {
            return 0;
        }

        // 1. Hitung Bobot Item terhadap Proyek
        $bobotItem = ($rabItem->total_harga / $totalProjectValue) * 100;

        // 2. Hitung Progres (Volume Input / Volume Target RAB * Bobot Item)
        $progress = ($volumeHarian / $rabItem->volume) * $bobotItem;

        // Bulatkan 4 angka di belakang koma untuk presisi tinggi di Kurva S
        return round($progress, 4);
    }
}
