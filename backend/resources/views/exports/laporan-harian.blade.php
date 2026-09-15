<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Harian - {{ $report->tanggal }}</title>
    <style>
        body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px;}
        th, td { border: 1px solid #000; padding: 5px; vertical-align: middle; }
        .border-none-right { border-right: none !important; }
        .border-none-left { border-left: none !important; }
        .border-none-bottom { border-bottom: none !important; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .bg-grey { background-color: #e2e8f0; }
        .text-sm { font-size: 9px; }
        .align-top { vertical-align: top; }
    </style>
</head>
<body>
    <table>
        <!-- ===================================== -->
        <!-- BAGIAN KOP SURAT (HEADER DIPERBAIKI)  -->
        <!-- ===================================== -->
        <tr>
            <!-- LOGO -->
            <th colspan="2" class="text-center border-none-right" style="padding: 15px 10px;">
                <img src="{{ public_path('logo.png') }}" width="65" alt="LOGO">
            </th>
            <!-- TEXT TENGAH -->
            <th colspan="6" class="text-center border-none-left border-none-right" style="padding: 15px 10px;">
                <div style="font-size: 14px;">PEMERINTAH KABUPATEN / KOTA DAERAH</div>
                <div style="font-size: 15px; font-weight: bold; margin: 5px 0;">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
                <div style="font-size: 9px; font-weight: normal;">Alamat: Jl. Jendral Sudirman No. 1 Kode Pos 12345 Telp/Fax. (0123) 456789</div>
            </th>
            <!-- KOTAK KANAN -->
            <th colspan="4" class="text-center font-bold" style="font-size: 14px;">
                BUKU HARIAN STANDAR<br>CATATAN HARIAN
            </th>
        </tr>

        <!-- ===================================== -->
        <!-- INFORMASI PROYEK                      -->
        <!-- ===================================== -->
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">KEGIATAN</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->kategori ?? 'PENYELENGGARAAN JALAN KABUPATEN/KOTA' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Tanggal</td>
            <td colspan="2" class="border-none-left border-none-bottom">: {{ \Carbon\Carbon::parse($report->tanggal)->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">PEKERJAAN</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->nama_proyek }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Kode Kontrak</td>
            <td colspan="2" class="border-none-left border-none-bottom">: {{ $report->project->kode_kontrak }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right border-none-bottom">KONTRAKTOR</td>
            <td colspan="6" class="border-none-left border-none-right border-none-bottom">: {{ $report->project->kontraktor ?? '-' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right border-none-bottom">Pengawas</td>
            <td colspan="2" class="border-none-left border-none-bottom">: {{ $report->pengawas }}</td>
        </tr>
        <tr>
            <td colspan="2" class="font-bold border-none-right">KONSULTAN</td>
            <td colspan="6" class="border-none-left border-none-right">: {{ $report->project->konsultan ?? '-' }}</td>
            <td colspan="2" class="font-bold border-none-left border-none-right">Lokasi</td>
            <td colspan="2" class="border-none-left">: {{ $report->lokasi }}</td>
        </tr>

        <!-- ===================================== -->
        <!-- BAGIAN KIRI (PEKERJAAN) & KANAN (ALAT)-->
        <!-- ===================================== -->
        <tr>
            <td colspan="6" class="font-bold bg-grey">A. URAIAN PEKERJAAN</td>
            <td colspan="6" class="font-bold bg-grey">B. PEMAKAIAN PERALATAN</td>
        </tr>
        <tr class="text-center font-bold text-sm">
            <td style="width: 3%;">NO</td>
            <td colspan="2" style="width: 25%;">JENIS PEKERJAAN</td>
            <td style="width: 12%;">LOKASI (STA)</td>
            <td style="width: 5%;">VOL</td>
            <td style="width: 5%;">SAT</td>

            <td style="width: 3%;">NO</td>
            <td colspan="3" style="width: 32%;">JENIS / NAMA ALAT MESIN</td>
            <td colspan="2" style="width: 15%;">JUMLAH UNIT</td>
        </tr>

        @php
            // Cari tahu mana array yang lebih panjang agar tabel kiri & kanan seimbang
            $maxAC = max(count($report->activities), count($report->equipments));
            if($maxAC == 0) $maxAC = 1;
        @endphp

        @for($i = 0; $i < $maxAC; $i++)
            <tr>
                <!-- SISI KIRI: PEKERJAAN -->
                <td class="text-center">{{ isset($report->activities[$i]) ? $i+1 : '' }}</td>
                <td colspan="2">{{ $report->activities[$i]->uraian ?? '' }}</td>
                <td class="text-center text-sm">
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
                <td class="text-center font-bold">{{ isset($report->activities[$i]) ? (float)$report->activities[$i]->volume : '' }}</td>
                <td class="text-center">{{ $report->activities[$i]->satuan ?? '' }}</td>

                <!-- SISI KANAN: PERALATAN -->
                <td class="text-center">{{ isset($report->equipments[$i]) ? $i+1 : '' }}</td>
                <td colspan="3">{{ $report->equipments[$i]->nama_alat ?? '' }}</td>
                <td colspan="2" class="text-center">{{ $report->equipments[$i]->jumlah ?? '' }}</td>
            </tr>
        @endfor

        <!-- ===================================== -->
        <!-- BAGIAN KIRI (PERSONIL) & KANAN (CUACA)-->
        <!-- ===================================== -->
        <tr>
            <td colspan="6" class="font-bold bg-grey">C. PERSONIL PROYEK / TENAGA KERJA</td>
            <td colspan="6" class="font-bold bg-grey">D. CUACA / BENCANA ALAM</td>
        </tr>
        <tr class="text-center font-bold text-sm">
            <td>NO</td>
            <td colspan="3">TUGAS / JABATAN</td>
            <td colspan="2">JUMLAH ORANG</td>
            <td colspan="6">KETERANGAN CUACA / KENDALA LAPANGAN</td>
        </tr>

        @php
            $maxPersonil = count($report->personnels);
            if($maxPersonil < 2) $maxPersonil = 2; // Minimal 2 baris agar kolom cuaca terlihat bagus
        @endphp

        @for($i = 0; $i < $maxPersonil; $i++)
            <tr>
                <!-- SISI KIRI: PERSONIL -->
                <td class="text-center">{{ isset($report->personnels[$i]) ? $i+1 : '' }}</td>
                <td colspan="3">{{ $report->personnels[$i]->peran ?? '' }}</td>
                <td colspan="2" class="text-center">{{ $report->personnels[$i]->jumlah ?? '' }}</td>

                <!-- SISI KANAN: CUACA (Digabung Barisnya/Rowspan) -->
                @if($i == 0)
                    <td colspan="6" rowspan="{{ $maxPersonil }}" class="text-left align-top text-sm" style="padding: 10px; line-height: 1.6;">
                        <!-- Gunakan nl2br agar enter/baris baru di textarea terbaca di PDF -->
                        {!! nl2br(e($report->cuaca ?: 'Tidak ada catatan cuaca harian.')) !!}
                    </td>
                @endif
            </tr>
        @endfor

        <!-- ===================================== -->
        <!-- BAGIAN BAWAH (TANDA TANGAN & CATATAN) -->
        <!-- ===================================== -->
        <tr>
            <td colspan="12" class="font-bold bg-grey">E. CATATAN / PELAPORAN / TANDA TANGAN</td>
        </tr>
        <tr>
            <td colspan="12" style="height: 40px;" class="align-top">
                Catatan Harian: <br>
                -
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
