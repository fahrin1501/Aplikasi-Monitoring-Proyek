<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Project;

class ProjectScheduleController extends Controller
{
    public function getSchedules($projectId)
    {
        // 1. Ambil Data Project & RAB
        $projectInfo = Project::find($projectId);
        $rabCategories = DB::table('rab_categories')->where('project_id', $projectId)->get();
        $rabItems = DB::table('rab_items')->whereIn('rab_category_id', $rabCategories->pluck('id'))->get();

        $rabData = [];
        foreach ($rabCategories as $cat) {
            $items = $rabItems->where('rab_category_id', $cat->id)->values();
            $rabData[] = [
                'id' => $cat->id,
                'nama_kategori' => $cat->nama_kategori,
                'kode_divisi' => $cat->kode_divisi ?? null,
                'items' => $items
            ];
        }

        // 2. Ambil Schedule Plan (Target Jadwal)
        $schedules = DB::table('schedules')
            ->join('rab_items', 'schedules.rab_item_id', '=', 'rab_items.id')
            ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
            ->where('rab_categories.project_id', $projectId)
            ->select('schedules.*')
            ->get();

        // 3. AMBIL DATA MENTAH UNTUK MODAL POP-UP (Drill-Down H1-H7 di Frontend)
        $rawRealizations = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->select(
                'daily_report_activities.rab_item_id',
                'daily_reports.minggu_ke',
                'daily_reports.tanggal as tgl_input',
                'daily_report_activities.volume as volume_laporan',
                'daily_report_activities.persentase as bobot_realisasi',
                'daily_reports.status as status_laporan'
            )
            ->get();

        // 4. OPTIMASI BACKEND: Hitung agregasi menggunakan SQL murni (Sangat Cepat)
        $aggregatedActuals = DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->where('daily_reports.project_id', $projectId)
            ->where('daily_reports.status', 'approved')
            ->select(
                'daily_report_activities.rab_item_id',
                'daily_reports.minggu_ke',
                DB::raw('SUM(daily_report_activities.persentase) as total_persen')
            )
            ->groupBy('daily_report_activities.rab_item_id', 'daily_reports.minggu_ke')
            ->get();

        // 5. BENTUK KAMUS DATA (DICTIONARY O(1)) UNTUK REACT
        $matrix_actual = [];
        $weekly_actual = [];
        $cumulative_actual = [];

        foreach($aggregatedActuals as $r) {
            // Untuk sel per item per minggu
            $matrix_actual[$r->rab_item_id][$r->minggu_ke] = (float) $r->total_persen;

            // Untuk target aktual bawah (Footer Mingguan)
            if(!isset($weekly_actual[$r->minggu_ke])) $weekly_actual[$r->minggu_ke] = 0;
            $weekly_actual[$r->minggu_ke] += (float) $r->total_persen;

            // Untuk total kumulatif paling kanan (Kumulatif Pekerjaan)
            if(!isset($cumulative_actual[$r->rab_item_id])) $cumulative_actual[$r->rab_item_id] = 0;
            $cumulative_actual[$r->rab_item_id] += (float) $r->total_persen;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'project_info' => $projectInfo,
                'rab_data' => $rabData,
                'schedules' => $schedules,

                // Payload khusus Matriks Aktual
                'matrix_actual' => $matrix_actual,
                'weekly_actual' => $weekly_actual,
                'cumulative_actual' => $cumulative_actual,
                'realizations' => $rawRealizations
            ]
        ]);
    }

    public function saveSchedules(Request $request, $projectId)
    {
        try {
            DB::beginTransaction();

            $isFullSync = $request->input('full_sync', false);
            $weeks = $request->input('weeks', []);

            // Jika Full Sync (Mode Edit dari Matriks Induk), hapus semua jadwal proyek ini dulu
            if ($isFullSync) {
                $rabItemIds = DB::table('rab_items')
                    ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                    ->where('rab_categories.project_id', $projectId)
                    ->pluck('rab_items.id')
                    ->toArray();

                if (!empty($rabItemIds)) {
                    DB::table('schedules')->whereIn('rab_item_id', $rabItemIds)->delete();
                }
            } else {
                // Jika tidak Full Sync (Dari Wizard AddSchedule Pertama Kali), hapus hanya minggu yang di-overwrite
                foreach ($weeks as $week) {
                    $rabItemIds = DB::table('rab_items')
                        ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                        ->where('rab_categories.project_id', $projectId)
                        ->pluck('rab_items.id')
                        ->toArray();

                    if (!empty($rabItemIds)) {
                        DB::table('schedules')
                            ->whereIn('rab_item_id', $rabItemIds)
                            ->where('minggu_ke', $week['minggu_ke'])
                            ->delete();
                    }
                }
            }

            $insertData = [];
            $now = now();

            foreach ($weeks as $week) {
                $itemIds = $week['rab_item_ids'] ?? [];
                if (empty($itemIds)) continue;

                $targetKumulatif = (float) ($week['target_kumulatif'] ?? 0);

                // BAGI RATA TARGET KUMULATIF KE SELURUH ITEM DI MINGGU TERSEBUT
                $bobotPerItem = count($itemIds) > 0 ? ($targetKumulatif / count($itemIds)) : 0;

                foreach ($itemIds as $itemId) {
                    $insertData[] = [
                        'rab_item_id' => $itemId,
                        'minggu_ke' => $week['minggu_ke'],
                        'bulan' => $week['bulan'] ?? null,
                        'tanggal_awal' => $week['tanggal_awal'] ?? null,
                        'tanggal_akhir' => $week['tanggal_akhir'] ?? null,
                        'target_kumulatif' => $targetKumulatif,
                        'bobot_rencana' => $bobotPerItem,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // Insert massal
            if (!empty($insertData)) {
                DB::table('schedules')->insert($insertData);
            }

            // Sync Status Proyek (Opsional, agar tahu proyek sudah dijadwalkan)
            $project = Project::find($projectId);
            if ($project && $project->status === 'Perencanaan') {
                $project->update(['status' => 'Persiapan']);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Target Jadwal Matriks berhasil disimpan!']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'System Crash: ' . $e->getMessage()], 500);
        }
    }

    public function destroySchedules($projectId)
    {
        try {
            DB::beginTransaction();

            $rabItemIds = DB::table('rab_items')
                ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
                ->where('rab_categories.project_id', $projectId)
                ->pluck('rab_items.id')
                ->toArray();

            if (!empty($rabItemIds)) {
                DB::table('schedules')->whereIn('rab_item_id', $rabItemIds)->delete();
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Seluruh Jadwal Matriks berhasil dikosongkan.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage()], 500);
        }
    }

    // Fungsi export (Excel/PDF) tidak perlu diubah, biarkan seperti yang ada jika sudah punya
}
