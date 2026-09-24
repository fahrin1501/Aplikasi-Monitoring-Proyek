<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>RAB dan Realisasi</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000000; padding: 6px; }
        th { font-weight: bold; text-align: center; vertical-align: middle; }
        .bg-head { background-color: #cbd5e1; }
        .bg-plan { background-color: #eff6ff; }
        .bg-actual { background-color: #ecfdf5; }
        .bg-sub { background-color: #f1f5f9; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">LAPORAN RENCANA ANGGARAN BIAYA DAN REALISASI FISIK</div>
        <div class="subtitle">{{ $project->nama_proyek }} | SPK: {{ $project->kode_kontrak }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2" class="bg-head" style="width: 5%">KODE</th>
                <th rowspan="2" class="bg-head" style="width: 25%">URAIAN PEKERJAAN</th>
                <th rowspan="2" class="bg-head" style="width: 5%">SAT</th>
                <th colspan="4" class="bg-plan">RENCANA (PLAN)</th>
                <th colspan="3" class="bg-actual">REALISASI (ACTUAL)</th>
            </tr>
            <tr>
                <th class="bg-plan">Vol</th>
                <th class="bg-plan">Harga Satuan (Rp)</th>
                <th class="bg-plan">Total (Rp)</th>
                <th class="bg-plan">Rencana + PPN 11% (Rp)</th>
                <th class="bg-actual">Vol</th>
                <th class="bg-actual">Total (Rp)</th>
                <th class="bg-actual">Realisasi + PPN 11% (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rabs as $divisi)
                <tr>
                    <td class="bg-sub text-center" style="color: #d97706;">{{ $divisi->kode_divisi }}</td>
                    <td colspan="9" class="bg-sub" style="color: #d97706;">{{ $divisi->nama_kategori }}</td>
                </tr>

                @foreach($divisi->items as $item)
                    @if($item->is_subheader)
                        <tr>
                            <td class="font-bold text-center">{{ $item->kode_pekerjaan }}</td>
                            <td colspan="9" class="font-bold" style="padding-left: 15px;">{{ $item->uraian_pekerjaan }}</td>
                        </tr>
                    @else
                        <tr>
                            <td class="text-center">{{ $item->kode_pekerjaan }}</td>
                            <td style="padding-left: 20px;">{{ $item->uraian_pekerjaan }}</td>
                            <td class="text-center">{{ $item->satuan }}</td>

                            @if(isset($isExcel) && $isExcel)
                                <td class="text-center">{{ $item->volume }}</td>
                                <td class="text-right">{{ $item->harga_satuan }}</td>
                                <td class="text-right">{{ $item->total_harga }}</td>
                                <td class="text-right">{{ $item->rencanaTotalPPN }}</td>
                                <td class="text-center">{{ $item->actualVol }}</td>
                                <td class="text-right">{{ $item->actualTotal }}</td>
                                <td class="text-right">{{ $item->actualTotalPPN }}</td>
                            @else
                                <td class="text-center">{{ (float)$item->volume }}</td>
                                <td class="text-right">{{ number_format($item->harga_satuan, 0, ',', '.') }}</td>
                                <td class="text-right">{{ number_format($item->total_harga, 0, ',', '.') }}</td>
                                <td class="text-right">{{ number_format($item->rencanaTotalPPN, 0, ',', '.') }}</td>
                                <td class="text-center">{{ (float)$item->actualVol }}</td>
                                <td class="text-right">{{ number_format($item->actualTotal, 0, ',', '.') }}</td>
                                <td class="text-right">{{ number_format($item->actualTotalPPN, 0, ',', '.') }}</td>
                            @endif
                        </tr>
                    @endif
                @endforeach

                <tr>
                    <td colspan="5" class="text-right font-bold bg-sub">SUBTOTAL {{ $divisi->nama_kategori }}</td>
                    @if(isset($isExcel) && $isExcel)
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRencana }}</td>
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRencanaPPN }}</td>
                        <td class="bg-sub"></td>
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRealisasi }}</td>
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRealisasiPPN }}</td>
                    @else
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRencana, 0, ',', '.') }}</td>
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRencanaPPN, 0, ',', '.') }}</td>
                        <td class="bg-sub"></td>
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRealisasi, 0, ',', '.') }}</td>
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRealisasiPPN, 0, ',', '.') }}</td>
                    @endif
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="5" class="text-right bg-head font-bold">GRAND TOTAL</th>
                @if(isset($isExcel) && $isExcel)
                    <th class="text-right bg-head font-bold">{{ $grandTotalRencana }}</th>
                    <th class="text-right bg-head font-bold">{{ $grandTotalRencanaPPN }}</th>
                    <th class="bg-head"></th>
                    <th class="text-right bg-head font-bold">{{ $grandTotalRealisasi }}</th>
                    <th class="text-right bg-head font-bold">{{ $grandTotalRealisasiPPN }}</th>
                @else
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRencana, 0, ',', '.') }}</th>
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRencanaPPN, 0, ',', '.') }}</th>
                    <th class="bg-head"></th>
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRealisasi, 0, ',', '.') }}</th>
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRealisasiPPN, 0, ',', '.') }}</th>
                @endif
            </tr>
        </tfoot>
    </table>
</body>
</html>
