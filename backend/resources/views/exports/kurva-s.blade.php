@php
    $totalActualKumulatif = array_sum($weekly_actual ?? []);
@endphp

@if(!empty($isExcel))
    {{-- ========================================================================= --}}
    {{-- 1. STRUKTUR KHUSUS EXCEL: 1 TABEL TUNGGAL (AGAR TIDAK ERROR/CRASH)         --}}
    {{-- ========================================================================= --}}
    <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10px;">
        <!-- KOP LAPORAN -->
        <tr>
            <th colspan="{{ count($localWeeks) + 4 }}" style="text-align: center; font-size: 14px; font-weight: bold; height: 35px; border: none;">
                KURVA S & MATRIKS WAKTU REALISASI PROYEK
            </th>
        </tr>
        <tr>
            <th colspan="{{ count($localWeeks) + 4 }}" style="text-align: center; font-size: 11px; font-weight: normal; color: #475569; height: 25px; border: none;">
                {{ $project->nama_proyek ?? 'PROYEK' }}
            </th>
        </tr>
        <tr>
            <td style="font-weight: bold; width: 120px; border: none;">Lokasi</td>
            <td colspan="2" style="border: none;">: {{ $project->lokasi ?? '-' }}</td>
            <td style="font-weight: bold; border: none;">Tahun Anggaran</td>
            <td colspan="{{ max(1, count($localWeeks)) }}" style="border: none;">: {{ $project->tahun_anggaran ?? '-' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none;">No. Kontrak / SPK</td>
            <td colspan="2" style="border: none;">: {{ $project->kode_kontrak ?? '-' }}</td>
            <td style="font-weight: bold; border: none;">Total Nilai RAB</td>
            <td colspan="{{ max(1, count($localWeeks)) }}" style="border: none;">: Rp {{ number_format($grandTotalRAB ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td colspan="{{ count($localWeeks) + 4 }}" style="height: 15px; border: none;"></td>
        </tr>

        <!-- HEADER MATRIKS -->
        <thead>
            <tr bgcolor="#f1f5f9">
                <th style="width: 70px; text-align: center; font-weight: bold;">Kode</th>
                <th style="width: 280px; text-align: left; font-weight: bold;">Uraian Pekerjaan</th>
                <th style="width: 65px; text-align: center; font-weight: bold; color: #1d4ed8;">Bobot (%)</th>
                @foreach($localWeeks as $w)
                    <th style="width: 55px; text-align: center; font-weight: bold;">M-{{ $w->minggu_ke }}</th>
                @endforeach
                <th style="width: 80px; text-align: right; font-weight: bold; color: #047857;">Kumulatif</th>
            </tr>
        </thead>

        <!-- DATA MATRIKS -->
        <tbody>
            @foreach($rabData as $cat)
                <tr bgcolor="#e2e8f0">
                    <td align="center" style="font-weight: bold;">{{ $cat['kode_divisi'] ?? '-' }}</td>
                    <td colspan="{{ count($localWeeks) + 3 }}" style="font-weight: bold; text-transform: uppercase;">{{ $cat['nama_kategori'] }}</td>
                </tr>

                @foreach($cat['items'] as $item)
                    @php
                        $itemId = $item->id ?? 'manual';
                        $kumulatif = $cumulative_actual[$itemId] ?? 0;
                    @endphp
                    <tr>
                        <td align="center">{{ $item->kode_pekerjaan ?? '-' }}</td>
                        <td>{{ $item->uraian_pekerjaan }}</td>
                        <td align="center" style="font-weight: bold; color: #1d4ed8;">
                            {{ !empty($item->is_manual) ? '-' : number_format($item->bobot ?? 0, 2) . '%' }}
                        </td>

                        @foreach($localWeeks as $w)
                            @php
                                $val = $matrix_actual[$itemId][$w->minggu_ke] ?? 0;
                            @endphp
                            <td align="center">
                                {{ $val > 0 ? number_format($val, 2) : '-' }}
                            </td>
                        @endforeach

                        <td align="right" style="font-weight: bold; color: #047857;">
                            {{ $kumulatif > 0 ? number_format($kumulatif, 2) . '%' : '-' }}
                        </td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>

        <!-- FOOTER MATRIKS -->
        <tfoot>
            <tr bgcolor="#ecfdf5">
                <td colspan="3" align="right" style="font-weight: bold; color: #047857;">TOTAL REALISASI / AKTUAL (%)</td>
                @foreach($localWeeks as $w)
                    @php
                        $wActual = $weekly_actual[$w->minggu_ke] ?? 0;
                    @endphp
                    <td align="center" style="font-weight: bold; color: #047857;">{{ $wActual > 0 ? number_format($wActual, 2) : '-' }}</td>
                @endforeach
                <td align="right" style="font-weight: bold; color: #047857;">{{ number_format($totalActualKumulatif, 2) }}%</td>
            </tr>

            <tr bgcolor="#eff6ff">
                <td colspan="3" align="right" style="font-weight: bold; color: #1d4ed8;">TARGET KUMULATIF RENCANA (%)</td>
                @foreach($localWeeks as $w)
                    <td align="center" style="font-weight: bold; color: #1d4ed8;">{{ number_format($w->target_kumulatif ?? 0, 2) }}</td>
                @endforeach
                <td align="right" style="font-weight: bold; color: #1d4ed8;">-</td>
            </tr>
        </tfoot>
    </table>
@else
    {{-- ========================================================================= --}}
    {{-- 2. STRUKTUR KHUSUS PDF: DENGAN CHUNK 10 MINGGU & GRAFIK KURVA S             --}}
    {{-- ========================================================================= --}}
    @php
        $weeksCollection = collect($localWeeks);
        $weekChunks = $weeksCollection->chunk(10);
    @endphp
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>Kurva S & Matriks Proyek</title>
        <style>
            @page {
                size: a4 landscape;
                margin: 8mm 10mm;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 8.5px;
                color: #1e293b;
                margin: 0;
                padding: 0;
            }
            .header-title { text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
            .header-sub { text-align: center; font-size: 10px; color: #475569; margin-bottom: 8px; }
            .info-table { width: 100%; margin-bottom: 8px; border-collapse: collapse; font-size: 8.5px; }
            .info-table td { padding: 2px 4px; vertical-align: top; }
            .chart-box { text-align: center; margin-bottom: 10px; }
            .chart-img { max-width: 92%; height: 175px; border: 1px solid #cbd5e1; }
            table.matrix-table { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 10px; }
            table.matrix-table th, table.matrix-table td { border: 1px solid #94a3b8; padding: 3px 4px; }
            table.matrix-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; text-transform: uppercase; }
            .bg-category { background-color: #e2e8f0; font-weight: bold; }
            .bg-actual { background-color: #ecfdf5; color: #047857; font-weight: bold; }
            .bg-plan { background-color: #eff6ff; color: #1d4ed8; font-weight: bold; }
            .page-break { page-break-before: always; }
            .section-badge { font-size: 9px; font-weight: bold; color: #334155; margin-bottom: 4px; text-transform: uppercase; }
        </style>
    </head>
    <body>
        {{-- KOP LAPORAN --}}
        <table border="0" class="info-table">
            <tr>
                <td colspan="6" class="header-title">KURVA S & MATRIKS WAKTU REALISASI PROYEK</td>
            </tr>
            <tr>
                <td colspan="6" class="header-sub">{{ $project->nama_proyek ?? 'PROYEK' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; width: 110px;">Lokasi</td>
                <td style="width: 250px;">: {{ $project->lokasi ?? '-' }}</td>
                <td style="font-weight: bold; width: 110px;">Tahun Anggaran</td>
                <td>: {{ $project->tahun_anggaran ?? '-' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">No. Kontrak / SPK</td>
                <td>: {{ $project->kode_kontrak ?? '-' }}</td>
                <td style="font-weight: bold;">Total Nilai RAB</td>
                <td>: Rp {{ number_format($grandTotalRAB ?? 0, 0, ',', '.') }}</td>
            </tr>
        </table>

        {{-- GAMBAR GRAFIK (HALAMAN 1) --}}
        @if(!empty($chartImageBase64))
            <div class="chart-box">
                <img src="{{ $chartImageBase64 }}" class="chart-img" alt="Grafik Kurva S">
            </div>
        @endif

        {{-- TABEL MATRIKS PER 10 MINGGU --}}
        @foreach($weekChunks as $chunkIndex => $weeksChunk)
            @if($chunkIndex > 0 && $chunkIndex % 2 == 1)
                <div class="page-break"></div>
            @endif

            <div class="section-badge" style="margin-top: {{ $chunkIndex > 0 && $chunkIndex % 2 == 0 ? '12px' : '4px' }};">
                Matriks Bagian {{ $chunkIndex + 1 }}: Minggu Ke-{{ $weeksChunk->first()->minggu_ke }} s/d Minggu Ke-{{ $weeksChunk->last()->minggu_ke }}
            </div>

            <table border="1" cellpadding="3" cellspacing="0" class="matrix-table">
                <thead>
                    <tr bgcolor="#f1f5f9">
                        <th style="width: 55px; text-align: center;">Kode</th>
                        <th style="width: 260px; text-align: left;">Uraian Pekerjaan</th>
                        <th style="width: 55px; text-align: center; color: #1d4ed8;">Bobot (%)</th>
                        @foreach($weeksChunk as $w)
                            <th style="width: 40px; text-align: center;">M-{{ $w->minggu_ke }}</th>
                        @endforeach
                        <th style="width: 65px; text-align: right; color: #047857;">Kumulatif</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($rabData as $cat)
                        <tr bgcolor="#e2e8f0" class="bg-category">
                            <td align="center">{{ $cat['kode_divisi'] ?? '-' }}</td>
                            <td colspan="{{ count($weeksChunk) + 3 }}">{{ $cat['nama_kategori'] }}</td>
                        </tr>

                        @foreach($cat['items'] as $item)
                            @php
                                $itemId = $item->id ?? 'manual';
                                $kumulatif = $cumulative_actual[$itemId] ?? 0;
                            @endphp
                            <tr>
                                <td align="center">{{ $item->kode_pekerjaan ?? '-' }}</td>
                                <td>{{ $item->uraian_pekerjaan }}</td>
                                <td align="center" style="font-weight: bold; color: #1d4ed8;">
                                    {{ !empty($item->is_manual) ? '-' : number_format($item->bobot ?? 0, 2) . '%' }}
                                </td>

                                @foreach($weeksChunk as $w)
                                    @php
                                        $val = $matrix_actual[$itemId][$w->minggu_ke] ?? 0;
                                    @endphp
                                    <td align="center">
                                        {{ $val > 0 ? number_format($val, 2) : '-' }}
                                    </td>
                                @endforeach

                                <td align="right" style="font-weight: bold; color: #047857;">
                                    {{ $kumulatif > 0 ? number_format($kumulatif, 2) . '%' : '-' }}
                                </td>
                            </tr>
                        @endforeach
                    @endforeach
                </tbody>
                <tfoot>
                    <tr bgcolor="#ecfdf5" class="bg-actual">
                        <td colspan="3" align="right">TOTAL REALISASI / AKTUAL (%)</td>
                        @foreach($weeksChunk as $w)
                            @php
                                $wActual = $weekly_actual[$w->minggu_ke] ?? 0;
                            @endphp
                            <td align="center">{{ $wActual > 0 ? number_format($wActual, 2) : '-' }}</td>
                        @endforeach
                        <td align="right">{{ number_format($totalActualKumulatif, 2) }}%</td>
                    </tr>
                    <tr bgcolor="#eff6ff" class="bg-plan">
                        <td colspan="3" align="right">TARGET KUMULATIF RENCANA (%)</td>
                        @foreach($weeksChunk as $w)
                            <td align="center">{{ number_format($w->target_kumulatif ?? 0, 2) }}</td>
                        @endforeach
                        <td align="right">-</td>
                    </tr>
                </tfoot>
            </table>
        @endforeach
    </body>
    </html>
@endif
