<!DOCTYPE html>
<html>
<head>
    <title>Executive Summary - {{ $project->nama_proyek }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .subtitle { font-size: 12px; color: #666; margin-top: 5px; }
        table { w-full; border-collapse: collapse; margin-bottom: 20px; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; width: 35%; }
        .section-title { background-color: #e2e8f0; font-weight: bold; padding: 8px; margin-top: 20px; margin-bottom: 10px;}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">EXECUTIVE SUMMARY PROYEK</div>
        <div class="subtitle">{{ $project->nama_proyek }}</div>
    </div>

    <div class="section-title">A. DATA KONTRAK & ADMINISTRASI</div>
    <table>
        <tr><th>Nama Proyek</th><td>{{ $project->nama_proyek }}</td></tr>
        <tr><th>Kategori Proyek</th><td>{{ $project->kategori ?? 'Belum Ditentukan' }}</td></tr>
        <tr><th>No. Kontrak Konsultan</th><td>{{ $project->kode_kontrak ?? '-' }}</td></tr>
        <tr><th>No. Kontrak Kontraktor</th><td>{{ $project->nomor_kontrak_kontraktor ?? '-' }}</td></tr>
        <tr><th>Nilai Kontrak</th><td>Rp {{ number_format($project->nilai_kontrak, 0, ',', '.') }}</td></tr>
        <tr><th>Sumber Dana & TA</th><td>{{ $project->sumber_dana ?? '-' }} ({{ $project->tahun_anggaran ?? '-' }})</td></tr>
        <tr><th>Status Proyek</th><td>{{ $project->status }}</td></tr>
    </table>

    <div class="section-title">B. WAKTU & LOKASI</div>
    <table>
        <tr><th>Periode Kontrak</th><td>{{ $project->tanggal_mulai }} s/d {{ $project->tanggal_selesai }}</td></tr>
        <tr><th>Waktu Pelaksanaan</th><td>{{ $project->waktu_pelaksanaan ?? '-' }}</td></tr>
        <tr><th>Masa Pemeliharaan</th><td>{{ $project->masa_pemeliharaan ?? '-' }}</td></tr>
        <tr><th>Lokasi Wilayah</th><td>{{ $project->lokasi_wilayah ?? '-' }}</td></tr>
        <tr><th>Koordinat</th><td>Lat: {{ $project->latitude ?? '-' }}, Long: {{ $project->longitude ?? '-' }}</td></tr>
    </table>

    <div class="section-title">C. PARA PIHAK & PERSONEL</div>
    <table>
        <tr><th>PPK / Owner</th><td>{{ $project->ppk ?? '-' }}</td></tr>
        <tr><th>Kontraktor Pelaksana</th><td>{{ $project->kontraktor ?? '-' }}</td></tr>
        <tr><th>Konsultan Pengawas</th><td>{{ $project->konsultan ?? '-' }}</td></tr>
        <tr>
            <th>Personel Lapangan</th>
            <td>
                @if($project->personnels && count($project->personnels) > 0)
                    <ul style="margin: 0; padding-left: 15px;">
                    @foreach($project->personnels as $person)
                        <li><b>{{ $person->nama }}</b> ({{ $person->peran }})</li>
                    @endforeach
                    </ul>
                @else
                    -
                @endif
            </td>
        </tr>
    </table>
</body>
</html>
