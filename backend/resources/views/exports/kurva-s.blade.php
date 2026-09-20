<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kurva S dan Kemajuan Proyek</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th, td { border: 1px solid #000000; padding: 6px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .bg-head { background-color: #cbd5e1; font-weight: bold; text-align: center; }
        .title-section { font-size: 13px; font-weight: bold; margin-bottom: 8px; margin-top: 15px; color: #0f172a;}
        .header-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
        .header-subtitle { font-size: 12px; text-align: center; margin-bottom: 20px; color: #555; }
    </style>
</head>
<body>
    <div class="header-title">LAPORAN KURVA S &amp; KEMAJUAN PROYEK</div>
    <div class="header-subtitle">
        {{ $project->nama_proyek }} | SPK: {{ $project->kode_kontrak }} <br>
        @if(isset($startDate) && isset($endDate))
            <strong>Periode Laporan:</strong> {{ \Carbon\Carbon::parse($startDate)->translatedFormat('d M Y') }} s/d {{ \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y') }}
        @endif
    </div>


    @if(!isset($isExcel) && isset($chartImageBase64))
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{ $chartImageBase64 }}" style="max-height: 350px; max-width: 900px; border: 1px solid #ccc;">
        </div>
    @endif

    @if(isset($isExcel))
        <table>
            @for($i=0; $i<18; $i++)
                <tr><td style="border: none;"></td></tr>
            @endfor
        </table>
    @endif

    <div class="title-section">1. TOTAL PROGRESS PEKERJAAN</div>
    <table>
        <thead>
            <tr>
                <th class="bg-head" style="width: 45%;">ITEM PEKERJAAN</th>
                <th class="bg-head" style="width: 20%;">VOL / SAT</th>
                <th class="bg-head" style="width: 15%;">BOBOT (%)</th>
                <th class="bg-head" style="width: 20%;">PROGRESS (%)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($itemProgress as $item)
                <tr>
                    <td>{{ $item['nama'] }}</td>
                    <td class="text-center">{{ $item['volume'] }} {{ $item['satuan'] }}</td>
                    <td class="text-center">{{ number_format($item['bobot'], 2) }}</td>
                    <td class="text-right font-bold" style="color: {{ $item['progress'] >= 100 ? 'green' : 'orange' }}">
                        {{ number_format($item['progress'], 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="title-section">2. PARAMETER EVALUASI DEVIASI (RENTANG TANGGAL)</div>
    <table>
        <thead>
            <tr>
                <th class="bg-head">TANGGAL</th>
                <th class="bg-head">PERIODE</th>
                <th class="bg-head">RENCANA (%)</th>
                <th class="bg-head">REALISASI (%)</th>
                <th class="bg-head">KUMULATIF RENCANA (%)</th>
                <th class="bg-head">KUMULATIF REALISASI (%)</th>
                <th class="bg-head">DEVIASI (%)</th>
                <th class="bg-head">STATUS</th>
            </tr>
        </thead>
        <tbody>
            @foreach($chartData as $row)
                @php
                    $isDevNegative = isset($row['deviasi']) && $row['deviasi'] < 0;
                    $status = "Positif";

                    if(isset($row['isPlanEmpty']) && $row['isPlanEmpty'] && isset($row['isActEmpty']) && $row['isActEmpty']) {
                        $status = "Belum Berjalan";
                    } elseif (isset($row['isActEmpty']) && $row['isActEmpty']) {
                        $status = "Menunggu Lap.";
                    } elseif ($isDevNegative) {
                        $status = "Terlambat";
                    }
                @endphp
                <tr>
                    <td class="text-center font-bold">{{ $row['displayDate'] ?? '-' }}</td>
                    <td class="text-center">{{ $row['label'] }}</td>
                    <td class="text-right">{{ isset($row['isPlanEmpty']) && $row['isPlanEmpty'] ? '-' : number_format($row['bobotRencana'] ?? 0, 2) }}</td>
                    <td class="text-right">{{ isset($row['isActEmpty']) && $row['isActEmpty'] ? '-' : number_format($row['bobotRealisasi'] ?? 0, 2) }}</td>
                    <td class="text-right">{{ isset($row['isPlanEmpty']) && $row['isPlanEmpty'] ? '-' : number_format($row['rencanaKumulatif'] ?? 0, 2) }}</td>
                    <td class="text-right">{{ isset($row['isActEmpty']) && $row['isActEmpty'] ? '-' : number_format($row['realisasiKumulatif'] ?? 0, 2) }}</td>

                    <td class="text-center font-bold" style="color: {{ isset($row['isActEmpty']) && $row['isActEmpty'] ? '#666' : ($isDevNegative ? 'red' : 'green') }}">
                        {{ isset($row['isActEmpty']) && $row['isActEmpty'] ? '-' : (($row['deviasi'] ?? 0) > 0 ? '+' : '') . number_format($row['deviasi'] ?? 0, 2) }}
                    </td>
                    <td class="text-center">{{ $status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
