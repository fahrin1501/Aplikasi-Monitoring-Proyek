@if(empty($isExcel))
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kurva S & Matriks Proyek</title>
    <style>
        @page { size: a3 landscape; margin: 10mm; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .chart-box { text-align: center; margin-bottom: 15px; }
        .chart-img { max-width: 95%; max-height: 280px; border: 1px solid #cbd5e1; }
    </style>
</head>
<body>
@endif

    {{-- KOP LAPORAN --}}
    <table border="0" style="width: 100%; margin-bottom: 10px;">
        <tr>
            <td colspan="{{ count($localWeeks) + 4 }}" style="text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase;">
                KURVA S & MATRIKS WAKTU REALISASI PROYEK
            </td>
        </tr>
        <tr>
            <td colspan="{{ count($localWeeks) + 4 }}" style="text-align: center; font-size: 11px; color: #475569; padding-bottom: 10px;">
                {{ $project->nama_proyek ?? 'PROYEK' }}
            </td>
        </tr>
        <tr>
            <td style="font-weight: bold; width: 120px;">Lokasi</td>
            <td colspan="2">: {{ $project->lokasi ?? '-' }}</td>
            <td style="font-weight: bold;">Tahun Anggaran</td>
            <td colspan="{{ max(1, count($localWeeks)) }}">: {{ $project->tahun_anggaran ?? '-' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">No. Kontrak / SPK</td>
            <td colspan="2">: {{ $project->kode_kontrak ?? '-' }}</td>
            <td style="font-weight: bold;">Total Nilai RAB</td>
            <td colspan="{{ max(1, count($localWeeks)) }}">: Rp {{ number_format($grandTotalRAB ?? 0, 0, ',', '.') }}</td>
        </tr>
    </table>

    {{-- GRAFIK: KHUSUS TAMPILAN PDF --}}
    @if(empty($isExcel) && !empty($chartImageBase64))
        <div class="chart-box">
            <img src="{{ $chartImageBase64 }}" class="chart-img" alt="Grafik Kurva S">
        </div>
    @elseif(!empty($isExcel))
        {{-- Baris kosong untuk area gambar pada Excel --}}
        <table>
            <tr><td colspan="{{ count($localWeeks) + 4 }}" style="height: 260px;"></td></tr>
        </table>
    @endif

    {{-- TABEL MATRIKS KURVA S --}}
    <table border="1" cellpadding="4" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 9px;">
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
        <tfoot>
            {{-- Baris Realisasi / Aktual --}}
            <tr bgcolor="#ecfdf5">
                <td colspan="3" align="right" style="font-weight: bold; color: #047857;">TOTAL REALISASI / AKTUAL (%)</td>
                @php $totalActualKumulatif = 0; @endphp
                @foreach($localWeeks as $w)
                    @php
                        $wActual = $weekly_actual[$w->minggu_ke] ?? 0;
                        $totalActualKumulatif += $wActual;
                    @endphp
                    <td align="center" style="font-weight: bold; color: #047857;">{{ $wActual > 0 ? number_format($wActual, 2) : '-' }}</td>
                @endforeach
                <td align="right" style="font-weight: bold; color: #047857;">{{ number_format($totalActualKumulatif, 2) }}%</td>
            </tr>

            {{-- Baris Target Rencana --}}
            <tr bgcolor="#eff6ff">
                <td colspan="3" align="right" style="font-weight: bold; color: #1d4ed8;">TARGET KUMULATIF RENCANA (%)</td>
                @foreach($localWeeks as $w)
                    <td align="center" style="font-weight: bold; color: #1d4ed8;">{{ number_format($w->target_kumulatif ?? 0, 2) }}</td>
                @endforeach
                <td align="right" style="font-weight: bold; color: #1d4ed8;">-</td>
            </tr>
        </tfoot>
    </table>

@if(empty($isExcel))
</body>
</html>
@endif
