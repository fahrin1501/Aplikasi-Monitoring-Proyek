<tbody>
            @foreach($rabs as $divisi)
                <!-- Header Divisi -->
                <tr>
                    <td colspan="7" class="bg-sub" style="color: #d97706;">{{ $divisi->nama_kategori }}</td>
                </tr>

                @foreach($divisi->items as $item)
                    @if($item->is_subheader)
                        <tr>
                            <td colspan="7" class="font-bold" style="padding-left: 15px;">{{ $item->uraian_pekerjaan }}</td>
                        </tr>
                    @else
                        <tr>
                            <td style="padding-left: 20px;">{{ $item->uraian_pekerjaan }}</td>
                            <td class="text-center">{{ $item->satuan }}</td>

                            <!-- BEDA FORMAT EXCEL VS PDF -->
                            @if(isset($isExcel) && $isExcel)
                                <td class="text-center">{{ $item->volume }}</td>
                                <td class="text-right">{{ $item->harga_satuan }}</td>
                                <td class="text-right">{{ $item->total_harga }}</td>
                                <td class="text-center">{{ $item->actualVol }}</td>
                                <td class="text-right">{{ $item->actualTotal }}</td>
                            @else
                                <td class="text-center">{{ (float)$item->volume }}</td>
                                <td class="text-right">{{ number_format($item->harga_satuan, 0, ',', '.') }}</td>
                                <td class="text-right">{{ number_format($item->total_harga, 0, ',', '.') }}</td>
                                <td class="text-center">{{ (float)$item->actualVol }}</td>
                                <td class="text-right">{{ number_format($item->actualTotal, 0, ',', '.') }}</td>
                            @endif
                        </tr>
                    @endif
                @endforeach

                <!-- Subtotal Divisi -->
                <tr>
                    <td colspan="4" class="text-right font-bold bg-sub">SUBTOTAL {{ $divisi->nama_kategori }}</td>
                    @if(isset($isExcel) && $isExcel)
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRencana }}</td>
                        <td class="bg-sub"></td>
                        <td class="text-right font-bold bg-sub">{{ $divisi->totalRealisasi }}</td>
                    @else
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRencana, 0, ',', '.') }}</td>
                        <td class="bg-sub"></td>
                        <td class="text-right font-bold bg-sub">{{ number_format($divisi->totalRealisasi, 0, ',', '.') }}</td>
                    @endif
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="4" class="text-right bg-head font-bold">GRAND TOTAL</th>
                @if(isset($isExcel) && $isExcel)
                    <th class="text-right bg-head font-bold">{{ $grandTotalRencana }}</th>
                    <th class="bg-head"></th>
                    <th class="text-right bg-head font-bold">{{ $grandTotalRealisasi }}</th>
                @else
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRencana, 0, ',', '.') }}</th>
                    <th class="bg-head"></th>
                    <th class="text-right bg-head font-bold">{{ number_format($grandTotalRealisasi, 0, ',', '.') }}</th>
                @endif
            </tr>
        </tfoot>
