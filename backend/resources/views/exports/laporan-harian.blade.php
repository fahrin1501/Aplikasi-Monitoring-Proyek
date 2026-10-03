<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Harian - {{ $report->tanggal }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
        th, td { border: 1px solid #000; padding: 6px; vertical-align: middle; word-wrap: break-word; }
        .border-none-right { border-right: none !important; }
        .border-none-left { border-left: none !important; }
        .border-none-bottom { border-bottom: none !important; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .bg-grey { background-color: #e2e8f0; }
        .text-sm { font-size: 9px; }
        .align-top { vertical-align: top; }
        .p-10 { padding: 10px; }
    </style>
</head>
<body>
    <table>
        <!-- ===================================== -->
        <!-- BAGIAN KOP SURAT (HEADER DIPERBAIKI)  -->
        <!-- ===================================== -->
        <tr>
            <!-- LOGO -->
            <th colspan="2" class="text-center border-none-right border-none-bottom p-10">
                <img src="{{ public_path('logo.png') }}" width="60" alt="LOGO">
            </th>
            <!-- TEXT TENGAH -->
            <th colspan="6" class="text-center border-none-left border-none-right border-none-bottom p-10">
                <div style="font-size: 14px;">PEMERINTAH DAERAH</div>
                <div style="font-size: 15px; font-weight: bold; margin: 4px 0;">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
                <div style="font-size: 9px; font-weight: normal;">Laporan Pengawasan Teknis Lapangan Harian Kontraktor</div>
            </th>
            <!-- KOTAK KANAN -->
            <th colspan="4" class="text-center font-bold border-none-bottom" style="font-size: 14px;">
                BUKU HARIAN STANDAR<br>CATATAN HARIAN
            </th>
        </tr>

        <!-- ===================================== -->
        <!-- INFORMASI PROYEK (GRID 12 KOLOM)      -->
        <!-- ===================================== -->
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">KEGIATAN</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->kategori ?? 'PENYELENGGARAAN INFRASTRUKTUR' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Tanggal</td>
            <td colspan="2" class="border-none-left border-none-bottom font-bold">: {{ \Carbon\Carbon::parse($report->tanggal)->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">PEKERJAAN</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->nama_proyek }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Minggu Ke-</td>
            <td colspan="2" class="border-none-left border-none-bottom font-bold">: M-{{ $report->minggu_ke }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">KONTRAKTOR</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->kontraktor ?? '-' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Kode Kontrak</td>
            <td colspan="2" class="border-none-left border-none-bottom">: {{ $report->project->kode_kontrak }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right">KONSULTAN</td>
            <td colspan="6" class="border-none-left border-none-right">: {{ $report->project->konsultan ?? '-' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right">Lokasi Proyek</td>
            <td colspan="2" class="border-none-left">: {{ $report->lokasi }}</td>
        </tr>

        <!-- ===================================== -->
        <!-- BAGIAN KIRI (PEKERJAAN) & KANAN (ALAT)-->
        <!-- ===================================== -->
        <tr>
            <td colspan="6" class="font-bold bg-grey text-center">A. URAIAN PEKERJAAN LAPANGAN</td>
            <td colspan="6" class="font-bold bg-grey text-center">B. PEMAKAIAN PERALATAN KERJA</td>
        </tr>
        <tr class="text-center font-bold text-sm bg-grey">
            <td colspan="1" style="width: 4%;">NO</td>
            <td colspan="2" style="width: 24%;">JENIS / URAIAN PEKERJAAN</td>
            <td colspan="1" style="width: 14%;">LOKASI (STA)</td>
            <td colspan="1" style="width: 10%;">VOL & SAT</td>
            <td colspan="1" style="width: 8%;">BOBOT</td>

            <td colspan="1" style="width: 4%;">NO</td>
            <td colspan="3" style="width: 26%;">JENIS / NAMA ALAT MESIN</td>
            <td colspan="2" style="width: 10%;">JUMLAH UNIT</td>
        </tr>

        @php
            // Cari tahu mana array yang lebih panjang agar tabel kiri & kanan seimbang
            $maxAC = max(count($report->activities), count($report->equipments));
            if($maxAC == 0) $maxAC = 1;
        @endphp

        @for($i = 0; $i < $maxAC; $i++)
            <tr>
                <!-- SISI KIRI: PEKERJAAN -->
                <td class="text-center align-top">{{ isset($report->activities[$i]) ? $i+1 : '' }}</td>
                <td colspan="2" class="align-top">{{ $report->activities[$i]->uraian ?? '' }}</td>
                <td class="text-center text-sm align-top">
                    @if(isset($report->activities[$i]))
                        @if($report->activities[$i]->sta_awal || $report->activities[$i]->sta_akhir)
                            {{ $report->activities[$i]->sta_awal ?: '...' }}<br>
                            s/d<br>
                            {{ $report->activities[$i]->sta_akhir ?: '...' }}
                        @else
                            -
                        @endif
                    @endif
                </td>
                <td class="text-center font-bold align-top">
                    @if(isset($report->activities[$i]))
                        {{ (float)$report->activities[$i]->volume }}<br>
                        <span class="text-sm" style="font-weight: normal;">{{ $report->activities[$i]->satuan }}</span>
                    @endif
                </td>
                <td class="text-center font-bold align-top">
                    @if(isset($report->activities[$i]))
                        {{ (float)$report->activities[$i]->persentase }}%
                    @endif
                </td>

                <!-- SISI KANAN: PERALATAN -->
                <td class="text-center align-top">{{ isset($report->equipments[$i]) ? $i+1 : '' }}</td>
                <td colspan="3" class="align-top">{{ $report->equipments[$i]->nama_alat ?? '' }}</td>
                <td colspan="2" class="text-center font-bold align-top">
                    @if(isset($report->equipments[$i]))
                        {{ $report->equipments[$i]->jumlah }} Unit
                    @endif
                </td>
            </tr>
        @endfor

        <!-- ===================================== -->
        <!-- BAGIAN KIRI (PERSONIL) & KANAN (CUACA)-->
        <!-- ===================================== -->
        <tr>
            <td colspan="6" class="font-bold bg-grey text-center">C. PERSONIL / MANPOWER</td>
            <td colspan="6" class="font-bold bg-grey text-center">D. KONDISI CUACA HARIAN</td>
        </tr>
        <tr class="text-center font-bold text-sm bg-grey">
            <td colspan="1">NO</td>
            <td colspan="3">POSISI / JABATAN / PERAN</td>
            <td colspan="2">JUMLAH ORANG</td>
            <td colspan="6">CATATAN CUACA / KENDALA ALAM</td>
        </tr>

        @php
            $maxPersonil = count($report->personnels);
            if($maxPersonil < 2) $maxPersonil = 2; // Minimal 2 baris agar kolom cuaca terlihat bagus
        @endphp

        @for($i = 0; $i < $maxPersonil; $i++)
            <tr>
                <!-- SISI KIRI: PERSONIL -->
                <td class="text-center align-top">{{ isset($report->personnels[$i]) ? $i+1 : '' }}</td>
                <td colspan="3" class="align-top">{{ $report->personnels[$i]->peran ?? '' }}</td>
                <td colspan="2" class="text-center font-bold align-top">
                    @if(isset($report->personnels[$i]))
                        {{ $report->personnels[$i]->jumlah }} Org
                    @endif
                </td>

                <!-- SISI KANAN: CUACA (Digabung Barisnya/Rowspan) -->
                @if($i == 0)
                    <td colspan="6" rowspan="{{ $maxPersonil }}" class="text-left align-top" style="padding: 10px; line-height: 1.6;">
                        <!-- nl2br agar format spasi/enter terbaca di PDF & Excel -->
                        {!! nl2br(e($report->cuaca ?: 'Cerah (Bekerja Full Time)')) !!}
                    </td>
                @endif
            </tr>
        @endfor

        <!-- ===================================== -->
        <!-- BAGIAN BAWAH (TANDA TANGAN & CATATAN) -->
        <!-- ===================================== -->
        <tr>
            <td colspan="12" class="font-bold bg-grey text-center">E. CATATAN TAMBAHAN / INSTRUKSI PENGAWAS</td>
        </tr>
        <tr>
            <td colspan="12" style="min-height: 60px; padding: 15px;" class="align-top text-sm">
                {!! nl2br(e($report->catatan ?: 'Tidak ada instruksi atau kendala khusus pada hari ini. Seluruh pekerjaan berjalan sesuai rencana.')) !!}
            </td>
        </tr>
        <tr class="text-center font-bold text-sm">
            <td colspan="4">DIKETAHUI OLEH<br>KONSULTAN PENGAWAS</td>
            <td colspan="4">DIPERIKSA OLEH<br>PENGAWAS LAPANGAN (DINAS)</td>
            <td colspan="4">DIBUAT OLEH<br>KONTRAKTOR PELAKSANA</td>
        </tr>
        <tr>
            <td colspan="4" style="height: 70px;"></td>
            <td colspan="4"></td>
            <td colspan="4"></td>
        </tr>
        <tr class="text-center font-bold">
            <td colspan="4">_________________________</td>
            <td colspan="4">_________________________</td>
            <td colspan="4">{{ strtoupper($report->pengawas) }}</td>
        </tr>
    </table>
</body>
</html>
