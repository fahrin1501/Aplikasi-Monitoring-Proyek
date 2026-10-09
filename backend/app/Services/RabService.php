<?php

namespace App\Services;

use App\Models\RabCategory;
use App\Models\RabItem;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RabService
{
    const TTL = 86400; // Cache 24 jam (dibersihkan otomatis saat ada update)

    /**
     * Key cache untuk data RAB proyek
     */
    public static function getCacheKey($projectId)
    {
        return "project_rab_data_{$projectId}";
    }

    public static function getSummaryCacheKey($projectId)
    {
        return "project_rab_summary_{$projectId}";
    }

    /**
     * Ambil data RAB lengkap dengan realisasi lapangan (Berbasis Cache)
     */
    public function getRabWithProgress($projectId)
    {
        return Cache::remember(self::getCacheKey($projectId), self::TTL, function () use ($projectId) {
            $categories = RabCategory::with('items')
                ->where('project_id', $projectId)
                ->get();

            $realisasiMap = $this->getRealisasiMap($projectId);

            return $categories->map(function ($cat) use ($realisasiMap) {
                $cat->items->transform(function ($item) use ($realisasiMap) {
                    if (!$item->is_subheader) {
                        $actualData = $realisasiMap[$item->id] ?? null;
                        $item->volume_realisasi = $actualData['volume'] ?? 0;
                        $item->persen_realisasi = $actualData['persen'] ?? 0;
                        $item->total_realisasi_harga = ($item->harga_satuan && $item->volume_realisasi)
                            ? $item->volume_realisasi * $item->harga_satuan
                            : 0;
                    }
                    return $item;
                });
                return $cat;
            });
        });
    }

    /**
     * Peta akumulasi realisasi per item RAB dari Laporan Harian yang Approved
     */
    public function getRealisasiMap($projectId)
    {
        $realizations = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->whereNotNull('daily_report_activities.rab_item_id')
            ->select(
                'daily_report_activities.rab_item_id',
                DB::raw('SUM(daily_report_activities.volume) as total_volume'),
                DB::raw('SUM(daily_report_activities.persentase) as total_persen')
            )
            ->groupBy('daily_report_activities.rab_item_id')
            ->get();

        $map = [];
        foreach ($realizations as $r) {
            $map[$r->rab_item_id] = [
                'volume' => (float) $r->total_volume,
                'persen' => (float) $r->total_persen
            ];
        }

        return $map;
    }

    /**
     * Hitung ringkasan total nilai rencana vs realisasi (untuk Ekspor & Analisis)
     */
    public function calculateSummary($projectId)
    {
        return Cache::remember(self::getSummaryCacheKey($projectId), self::TTL, function () use ($projectId) {
            $project = Project::findOrFail($projectId);
            $rabCategories = $this->getRabWithProgress($projectId);

            $grandTotalRencana = 0;
            $grandTotalRealisasi = 0;

            foreach ($rabCategories as $divisi) {
                $divRencana = 0;
                $divRealisasi = 0;

                foreach ($divisi->items as $item) {
                    if (!$item->is_subheader) {
                        $divRencana += (float) $item->total_harga;
                        $divRealisasi += (float) ($item->total_realisasi_harga ?? 0);
                    }
                }

                $divisi->total_rencana = $divRencana;
                $divisi->total_realisasi = $divRealisasi;
                $divisi->total_rencana_ppn = $divRencana * 1.11;
                $divisi->total_realisasi_ppn = $divRealisasi * 1.11;

                $grandTotalRencana += $divRencana;
                $grandTotalRealisasi += $divRealisasi;
            }

            return [
                'project' => $project,
                'rabs' => $rabCategories,
                'grandTotalRencana' => $grandTotalRencana,
                'grandTotalRealisasi' => $grandTotalRealisasi,
                'grandTotalRencanaPPN' => $grandTotalRencana * 1.11,
                'grandTotalRealisasiPPN' => $grandTotalRealisasi * 1.11,
            ];
        });
    }

    /**
     * Hapus cache RAB saat ada penambahan/perubahan item atau laporan diverifikasi
     */
    public static function clearCache($projectId)
    {
        Cache::forget(self::getCacheKey($projectId));
        Cache::forget(self::getSummaryCacheKey($projectId));

        // Hapus juga cache Kurva S karena angka realisasinya saling berkaitan
        ProjectCacheService::clearProjectCache($projectId);
    }
}
