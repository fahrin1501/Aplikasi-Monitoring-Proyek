<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
// PERBAIKAN: Gunakan Facade yang benar untuk DomPDF
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProjectDetailExport;
use App\Imports\ProjectsImport;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::orderBy('created_at', 'desc')->get()->map(function($project) {
            return $this->appendProgress($project);
        });
        return response()->json($projects);
    }

    public function show($id)
    {
        $project = Project::with(['personnels', 'documents', 'gisDocuments'])->findOrFail($id);
        $project = $this->appendProgress($project); // Inject progress ke detail proyek
        return response()->json($project);
    }

    public function getActiveForReport()
    {
        $projects = Project::whereNotIn('status', ['Selesai', 'Selesai 100%', 'Batal'])->get();
        $validProjects = $projects->filter(function ($project) {
            return \App\Models\ProjectSchedule::where('project_id', $project->id)->exists();
        })->values()->map(function($project) {
            return $this->appendProgress($project); // Inject progress
        });

        return response()->json(['status' => 'success', 'data' => $validProjects]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_proyek' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'kode_kontrak' => 'required|string|max:255',
            'nomor_kontrak_kontraktor' => 'nullable|string|max:255',
            'sumber_dana' => 'nullable|string|max:255',
            'tahun_anggaran' => 'nullable|string|max:4',
            'nilai_kontrak' => 'required|numeric',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'waktu_pelaksanaan' => 'nullable|string|max:255',
            'masa_pemeliharaan' => 'nullable|string|max:255',
            'lokasi_wilayah' => 'nullable|string|max:255',
            'ppk' => 'nullable|string|max:255',
            'kontraktor' => 'nullable|string|max:255',
            'konsultan' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'nullable|string',
            'foto_sampul' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        $validated['status'] = $validated['status'] ?? 'Persiapan';

        // 1. Simpan Foto ke Disk 'public'
        if ($request->hasFile('foto_sampul')) {
            $file = $request->file('foto_sampul');
            $fileName = time() . '_sampul_' . str_replace(' ', '_', $file->getClientOriginalName());

            $file->storeAs('foto_proyek', $fileName, 'public');

            $validated['foto_sampul'] = $fileName;
        }

        $project = Project::create($validated);

        // 2. Simpan Dokumen ke Disk 'public'
        if ($request->hasFile('dokumen_lampiran')) {
            $request->validate([
                'dokumen_lampiran.*' => 'file|mimes:pdf,xlsx,xls,dwg|max:20480'
            ]);

            foreach ($request->file('dokumen_lampiran') as $file) {
                $fileName = time() . '_doc_' . str_replace(' ', '_', $file->getClientOriginalName());

                $filePath = $file->storeAs('dokumen_lampiran', $fileName, 'public');

                $sizeInMB = number_format($file->getSize() / 1048576, 2) . ' MB';

                ProjectDocument::create([
                    'project_id' => $project->id,
                    'nama_file' => $file->getClientOriginalName(),
                    'path_file' => 'storage/' . $filePath,
                    'ukuran' => $sizeInMB
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Proyek beserta lampiran berhasil ditambahkan!',
            'data' => $project
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $rules = [
            'nama_proyek' => 'required|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'kode_kontrak' => 'required|string|max:255',
            'nomor_kontrak_kontraktor' => 'nullable|string|max:255',
            'sumber_dana' => 'nullable|string|max:255',
            'tahun_anggaran' => 'nullable|string|max:4',
            'nilai_kontrak' => 'required|numeric',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date',
            'waktu_pelaksanaan' => 'nullable|string|max:255',
            'masa_pemeliharaan' => 'nullable|string|max:255',
            'lokasi_wilayah' => 'nullable|string|max:255',
            'geojson_data' => 'nullable|string',
            'ppk' => 'nullable|string|max:255',
            'kontraktor' => 'nullable|string|max:255',
            'konsultan' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'status' => 'nullable|string',
        ];

        // Jika user minta hapus foto (remove_foto = true)
        if ($request->has('remove_foto') && $request->remove_foto == 'true') {
            if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
                Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
            }
            $project->foto_sampul = null;
            $project->save();
        }

        if ($request->hasFile('foto_sampul')) {
            $rules['foto_sampul'] = 'image|mimes:jpeg,png,jpg,webp|max:5120';
        }

        $validated = $request->validate($rules);

        // Proses ganti foto baru ke Disk 'public'
        if ($request->hasFile('foto_sampul')) {
            if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
                Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
            }

            $file = $request->file('foto_sampul');
            $fileName = time() . '_sampul_' . str_replace(' ', '_', $file->getClientOriginalName());

            $file->storeAs('foto_proyek', $fileName, 'public');

            $validated['foto_sampul'] = $fileName;
        } else {
            unset($validated['foto_sampul']);
        }

        $project->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data master proyek berhasil diperbarui!',
            'data' => $project
        ]);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);

        if ($project->foto_sampul && Storage::disk('public')->exists('foto_proyek/' . $project->foto_sampul)) {
            Storage::disk('public')->delete('foto_proyek/' . $project->foto_sampul);
        }

        $project->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data proyek berhasil dihapus permanen.'
        ]);
    }

    public function exportPdf($id)
    {
        $project = Project::with(['personnels', 'documents'])->findOrFail($id);

        // PERBAIKAN: Gunakan Facade yang sudah di-import di atas
        $pdf = Pdf::loadView('exports.project_pdf', compact('project'));

        // PERBAIKAN: Gunakan str_replace agar spasi pada nama proyek berubah jadi underscore untuk nama file
        $fileName = 'Executive_Summary_' . Str::slug($project->nama_proyek, '_') . '.pdf';

        return $pdf->download($fileName);
    }

    public function exportExcel($id)
    {
        $project = Project::findOrFail($id);

        // PERBAIKAN: Format nama file menjadi Data_Proyek_[Nama_Proyek]
        $fileName = 'Data_Proyek_' . Str::slug($project->nama_proyek, '_') . '.xlsx';

        return Excel::download(new ProjectDetailExport($id), $fileName);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls'
        ]);

        try {
            $sheets = Excel::toArray(new \stdClass(), $request->file('file'));

            $berhasilImport = 0;

            foreach ($sheets as $sheet) {

                $dataProyek = [
                    'status'            => 'Persiapan',
                    'kategori'          => 'Belum Ditentukan',
                    'deskripsi'         => 'Diimpor massal dari Excel',
                    'nama_proyek'       => null,
                    'kode_kontrak'      => '-',
                    'nomor_kontrak_kontraktor'  => '-',
                    'nilai_kontrak'     => 0,
                    'tanggal_mulai'     => null,
                    'tanggal_selesai'   => null,
                ];

                foreach ($sheet as $row) {
                    $parameter = strtolower(trim($row[0] ?? ''));
                    $nilai = $row[1] ?? null;

                    if (empty($parameter) || is_null($nilai)) continue;

                    if (str_contains($parameter, 'nama proyek')) {
                        $dataProyek['nama_proyek'] = $nilai;
                    }
                   elseif (str_contains($parameter, 'kontrak konsultan') || $parameter === 'kode kontrak') {
                        $dataProyek['kode_kontrak'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kontrak kontraktor')) {
                        $dataProyek['nomor_kontrak_kontraktor'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'nilai kontrak') || str_contains($parameter, 'pagu')) {
                        $dataProyek['nilai_kontrak'] = (float) preg_replace('/[^0-9]/', '', $nilai);
                    }
                    elseif (str_contains($parameter, 'sumber dana')) {
                        $dataProyek['sumber_dana'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'tahun anggaran')) {
                        $dataProyek['tahun_anggaran'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'tanggal mulai')) {
                        $dataProyek['tanggal_mulai'] = $this->formatExcelDate($nilai);
                    }
                    elseif (str_contains($parameter, 'tanggal selesai')) {
                        $dataProyek['tanggal_selesai'] = $this->formatExcelDate($nilai);
                    }
                    elseif (str_contains($parameter, 'waktu pelaksanaan')) {
                        $dataProyek['waktu_pelaksanaan'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'masa pemeliharaan')) {
                        $dataProyek['masa_pemeliharaan'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'lokasi') || str_contains($parameter, 'wilayah')) {
                        $dataProyek['lokasi_wilayah'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'ppk') || str_contains($parameter, 'owner')) {
                        $dataProyek['ppk'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'kontraktor') || str_contains($parameter, 'pelaksana')) {
                        $dataProyek['kontraktor'] = $nilai;
                    }
                    elseif (str_contains($parameter, 'konsultan') || str_contains($parameter, 'pengawas')) {
                        $dataProyek['konsultan'] = $nilai;
                    }
                }

                if (!empty($dataProyek['nama_proyek'])) {
                    Project::create($dataProyek);
                    $berhasilImport++;
                }
            }

            if ($berhasilImport === 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Format file tidak dikenali atau kolom "Nama Proyek" kosong di semua sheet.'
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => "Hebat! $berhasilImport proyek dari berbagai sheet berhasil diimpor."
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengimpor data: ' . $e->getMessage()
            ], 500);
        }
    }

    private function formatExcelDate($value)
    {
        if (empty($value)) return null;

        if (is_numeric($value)) {
            return Date::excelToDateTimeObject($value)->format('Y-m-d');
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    // Fungsi baru untuk menyuntikkan data progress secara real-time
    private function appendProgress($project) {
        // 1. Plan: Ambil target kumulatif dari minggu paling terakhir di-input
        $latestWeek = \Illuminate\Support\Facades\DB::table('project_schedules')
            ->where('project_id', $project->id)
            ->max('minggu_ke');

        $progressPlan = 0;
        if ($latestWeek) {
            $progressPlan = \Illuminate\Support\Facades\DB::table('project_schedules')
                ->where('project_id', $project->id)
                ->where('minggu_ke', $latestWeek)
                ->sum('bobot_rencana');
        }

        // 2. Actual: Ambil dari Laporan Harian 'Approved'
        $totalRab = \Illuminate\Support\Facades\DB::table('rab_items')
            ->join('rab_categories', 'rab_items.rab_category_id', '=', 'rab_categories.id')
            ->where('rab_categories.project_id', $project->id)
            ->where('rab_items.is_subheader', false)
            ->sum('rab_items.total_harga');

        $totalRealisasiUang = \Illuminate\Support\Facades\DB::table('daily_report_activities')
            ->join('daily_reports', 'daily_report_activities.daily_report_id', '=', 'daily_reports.id')
            ->join('rab_items', 'daily_report_activities.rab_item_id', '=', 'rab_items.id')
            ->where('daily_reports.project_id', $project->id)
            ->where('daily_reports.status', 'approved')
            ->sum(\Illuminate\Support\Facades\DB::raw('COALESCE( (daily_report_activities.persentase / 100) * rab_items.total_harga, daily_report_activities.volume * rab_items.harga_satuan )'));

        $progressActual = $totalRab > 0 ? ($totalRealisasiUang / $totalRab) * 100 : 0;
        $deviasi = $progressActual - $progressPlan;

        // Pasang ke Object
        $project->progress_plan = round($progressPlan, 2);
        $project->progress_actual = round($progressActual, 2);
        $project->deviasi = round($deviasi, 2);

        // 3. Status Otomatis
        if ($project->status !== 'Selesai') {
            if ($progressPlan == 0 && $progressActual == 0) $project->status = 'Belum Mulai';
            else if ($deviasi < -5) $project->status = 'Kritis';
            else if ($deviasi < 0) $project->status = 'Terlambat';
            else $project->status = 'On Track';
        }

        return $project;
    }


}
