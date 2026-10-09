<?php

namespace App\Services;

use App\Models\Project;
use App\Models\DailyReport;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    const CACHE_KEY = 'dashboard_summary_cache';
    const TTL = 86400; // 24 Jam

    public function getDashboardSummary()
    {
        return Cache::remember(self::CACHE_KEY, self::TTL, function () {
            // 1. Ambil Proyek & Suntikkan Progress
            $projects = Project::orderBy('created_at', 'desc')->get();
            $projectIds = $projects->pluck('id')->toArray();

            $plans = DB::table('project_schedules')
                ->whereIn('project_id', $projectIds)
                ->select('project_id', DB::raw('MAX(target_kumulatif) as max_plan'))
                ->groupBy('project_id')
                ->pluck('max_plan', 'project_id');

            $rabs = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->whereIn('rab_categories.project_id', $projectIds)
                ->where('rab_items.is_subheader', false)
                ->select('rab_categories.project_id', DB::raw('SUM(rab_items.total_harga) as total_rab'))
                ->groupBy('rab_categories.project_id')
                ->pluck('total_rab', 'project_id');

            $actuals = DB::table('daily_report_activities')
                ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
                ->join('rab_items', 'daily_report_activities.rab_item_id', '=', 'rab_items.id')
                ->whereIn('daily_reports.project_id', $projectIds)
                ->where('daily_reports.status', 'approved')
                ->select(
                    'daily_reports.project_id',
                    DB::raw('SUM(COALESCE( (daily_report_activities.persentase / 100) * rab_items.total_harga, daily_report_activities.volume * rab_items.harga_satuan )) as total_realisasi')
                )
                ->groupBy('daily_reports.project_id')
                ->pluck('total_realisasi', 'project_id');

            $totalNilaiKontrak = 0;
            $totalDeviasi = 0;
            $proyekKritis = 0;

            $optimizedProjects = $projects->map(function ($project) use ($plans, $rabs, $actuals, &$totalNilaiKontrak, &$totalDeviasi, &$proyekKritis) {
                $plan = $plans[$project->id] ?? 0;
                $totalRab = $rabs[$project->id] ?? 0;
                $totalReal = $actuals[$project->id] ?? 0;

                $actual = $totalRab > 0 ? ($totalReal / $totalRab) * 100 : 0;
                $deviasi = $actual - $plan;

                $project->progress_plan = round((float) $plan, 2);
                $project->progress_actual = round((float) $actual, 2);
                $project->deviasi = round((float) $deviasi, 2);

                if ($project->status !== 'Selesai') {
                    if ($plan == 0 && $actual == 0) $project->status = 'Belum Mulai';
                    else if ($deviasi < -5) { $project->status = 'Kritis'; $proyekKritis++; }
                    else if ($deviasi < 0) $project->status = 'Terlambat';
                    else $project->status = 'On Track';
                }

                $totalNilaiKontrak += (float) ($project->nilai_kontrak ?? 0);
                $totalDeviasi += $deviasi;

                return $project;
            });

            $top5Projects = $optimizedProjects->take(5);

            $chartProgress = $top5Projects->map(function ($p) {
                return [
                    'name' => $p->nama_proyek,
                    'plan' => $p->progress_plan,
                    'actual' => $p->progress_actual,
                    'deviasi' => $p->deviasi
                ];
            })->values();

            $activeProjectsTable = $top5Projects->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nama' => $p->nama_proyek,
                    'progress' => $p->progress_actual,
                    'deviasi' => $p->deviasi > 0 ? "+{$p->deviasi}" : (string) $p->deviasi,
                    'status' => $p->status,
                    'numDev' => $p->deviasi
                ];
            })->values();

            // 2. Ambil 5 Laporan Harian Terkini Ringkas
            $latestReports = DailyReport::with(['project:id,nama_proyek'])
                ->withCount('activities')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'pengawas' => $r->pengawas,
                        'proyek' => $r->project->nama_proyek ?? 'Proyek Dihapus',
                        'tanggal' => $r->tanggal,
                        'jumlahKegiatan' => $r->activities_count,
                        'status' => $r->status === 'approved' ? 'Verified' : 'Pending',
                        'originalData' => $r
                    ];
                });

            $avgDeviasi = $top5Projects->count() > 0 ? ($totalDeviasi / $top5Projects->count()) : 0;

            return [
                'kpi' => [
                    'totalProyek' => $projects->count(),
                    'nilaiKontrak' => number_format($totalNilaiKontrak, 0, ',', '.'),
                    'rataDeviasi' => $avgDeviasi > 0 ? "+" . number_format($avgDeviasi, 2) : number_format($avgDeviasi, 2),
                    'proyekKritis' => $proyekKritis
                ],
                'chartProgressData' => $chartProgress,
                'proyekAktif' => $activeProjectsTable,
                'laporanTerbaru' => $latestReports
            ];
        });
    }

    public static function clearCache()
    {
        Cache::forget(self::CACHE_KEY);
    }
}
