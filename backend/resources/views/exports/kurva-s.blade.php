<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kurva S & Matriks Proyek</title>
    <style>
        @page {
            size: a3 landscape;
            margin: 12mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .header-title {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .header-sub {
            text-align: center;
            font-size: 11px;
            color: #475569;
            margin-bottom: 15px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 12px;
            border-collapse: collapse;
        }
        .info-table td {
            font-size: 10px;
            padding: 2px 4px;
            vertical-align: top;
        }
        .chart-box {
            text-align: center;
            margin-bottom: 16px;
        }
        .chart-img {
            max-width: 95%;
            height: auto;
            max-height: 320px;
            border: 1px solid #cbd5e1;
        }
        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        table.matrix-table th, table.matrix-table td {
            border: 1px solid #94a3b8;
            padding: 4px 5px;
        }
        table.matrix-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
        }
        .bg-category {
            background-color: #e2e8f0;
            font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .bg-actual { background-color: #ecfdf5; color: #047857; font-weight: bold; }
        .bg-plan { background-color: #eff6ff; color: #1d4ed8; font-weight: bold; }
    </style>
</head>
<body>

    <div class="header-title">KURVA S & MATRIKS WAKTU REALISASI PROYEK</div>
    <div class="header-sub">{{ $project->nama_proyek ?? 'PROYEK' }}</div>

    <table class="info-table">
        <tr>
            <td width="15%"><strong>Lokasi</strong></td>
            <td width="35%">: {{ $project->lokasi ?? '-' }}</td>
            <td width="15%"><strong>Tahun Anggaran</strong></td>
            <td width="35%">: {{ $project->tahun_anggaran ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>No. Kontrak / SPK</strong></td>
            <td>: {{ $project->kode_kontrak ?? '-' }}</td>
            <td><strong>Total Nilai RAB</strong></td>
            <td>: Rp {{ number_format($grandTotalRAB ?? 0, 0, ',', '.') }}</td>
        </tr>
    </table>

    {{-- Tampilan Grafik untuk PDF --}}
    @if(empty($isExcel) && !empty($chartImageBase64))
        <div class="chart-box">
            <img src="{{ $chartImageBase64 }}" class="chart-img" alt="Grafik Kurva S">
        </div>
    @endif

    {{-- Tabel Matriks S-Curve --}}
    <table class="matrix-table">
        <thead>
            <tr>
                <th style="width: 70px;">Kode</th>
                <th style="width: 280px;">Uraian Pekerjaan</th>
                <th style="width: 65px;">Bobot (%)</th>
                @foreach($localWeeks as $w)
                    <th style="width: 55px;">M-{{ $w->minggu_ke }}</th>
                @endforeach
                <th style="width: 75px;">Kumulatif</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rabData as $cat)
                <tr class="bg-category">
                    <td class="text-center">{{ $cat['kode_divisi'] ?? '-' }}</td>
                    <td colspan="{{ count($localWeeks) + 3 }}">{{ $cat['nama_kategori'] }}</td>
                </tr>

                @foreach($cat['items'] as $item)
                    @php
                        $itemId = $item->id ?? 'manual';
                        $kumulatif = $cumulative_actual[$itemId] ?? 0;
                    @endphp
                    <tr>
                        <td class="text-center">{{ $item->kode_pekerjaan ?? '-' }}</td>
                        <td>{{ $item->uraian_pekerjaan }}</td>
                        <td class="text-center font-bold" style="color: #2563eb;">
                            {{ !empty($item->is_manual) ? '-' : number_format($item->bobot ?? 0, 2) . '%' }}
                        </td>

                        @foreach($localWeeks as $w)
                            @php
                                $val = $matrix_actual[$itemId][$w->minggu_ke] ?? 0;
                            @endphp
                            <td class="text-center">
                                {{ $val > 0 ? number_format($val, 2) : '-' }}
                            </td>
                        @endforeach

                        <td class="text-right font-bold" style="color: #059669;">
                            {{ $kumulatif > 0 ? number_format($kumulatif, 2) . '%' : '-' }}
                        </td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
        <tfoot>
            {{-- Baris Realisasi / Aktual --}}
            <tr class="bg-actual">
                <td colspan="3" class="text-right">TOTAL REALISASI / AKTUAL (%)</td>
                @php $totalActualKumulatif = 0; @endphp
                @foreach($localWeeks as $w)
                    @php
                        $wActual = $weekly_actual[$w->minggu_ke] ?? 0;
                        $totalActualKumulatif += $wActual;
                    @endphp
                    <td class="text-center">{{ $wActual > 0 ? number_format($wActual, 2) : '-' }}</td>
                @endforeach
                <td class="text-right">{{ number_format($totalActualKumulatif, 2) }}%</td>
            </tr>

            {{-- Baris Rencana (Plan) --}}
            <tr class="bg-plan">
                <td colspan="3" class="text-right">TARGET KUMULATIF RENCANA (%)</td>
                @foreach($localWeeks as $w)
                    <td class="text-center">{{ number_format($w->target_kumulatif ?? 0, 2) }}</td>
                @endforeach
                <td class="text-right">-</td>
            </tr>
        </tfoot>
    </table>

</body>
</html>