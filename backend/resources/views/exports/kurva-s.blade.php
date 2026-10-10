<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kurva S - {{ $project->nama_proyek }}</title>
    <style>
        /* Pengaturan Kertas dan Font Dasar */
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }

        /* --- CLASS KUNCI UNTUK MEMISAH HALAMAN --- */
        .page-break {
            page-break-after: always; /* Memaksa konten selanjutnya pindah ke Halaman 2 */
        }

        /* --- CLASS UNTUK HALAMAN GRAFIK --- */
        .chart-container {
            width: 100%;
            text-align: center;
            margin-bottom: 20px;
        }
        .chart-container h2 {
            margin-bottom: 5px;
            font-size: 16px;
        }
        .chart-container p {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 12px;
            color: #555;
        }
        .chart-container img {
            width: 100%; /* Memaksa grafik melebar penuh sejauh margin kertas A4 Landscape */
            height: auto;
            max-height: 160mm; /* Menjaga tinggi proporsional agar tidak tertimpa margin bawah */
            object-fit: contain;
        }

        /* Style Tabel Matriks */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #333;
            padding: 4px;
            text-align: center;
            word-wrap: break-word;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        .text-left { text-align: left; }
    </style>
</head>
<body>

    <!-- ========================================== -->
    <!-- HALAMAN 1: GRAFIK KURVA S PENUH -->
    <!-- ========================================== -->
    @if(!empty($chartImageBase64))
    <div class="chart-container">
        <h2>GRAFIK KURVA S & JADWAL PROYEK</h2>
        <p>{{ strtoupper($project->nama_proyek) }}</p>

        <img src="{{ $chartImageBase64 }}" alt="Grafik Kurva S">
    </div>

    <!-- PEMISAH HALAMAN (Tabel akan dipaksa turun ke halaman berikutnya) -->
    <div class="page-break"></div>
    @endif


    <!-- ========================================== -->
    <!-- HALAMAN 2 & SETERUSNYA: TABEL MATRIKS -->
    <!-- ========================================== -->
    <div class="table-container">
        <!-- Jika grafik tidak dicetak (misal karena error base64), judul tetap muncul di halaman tabel -->
        @if(empty($chartImageBase64))
            <h2 style="text-align:center;">MATRIKS SCHEDULE PROYEK - {{ strtoupper($project->nama_proyek) }}</h2>
        @else
            <h3 style="margin-bottom: 10px;">TABEL RINCIAN MATRIKS REALISASI (Lanjutan)</h3>
        @endif

        <table>
            <thead>
                <tr>
                    <th rowspan="2" style="width: 5%;">Kode</th>
                    <th rowspan="2" style="width: 25%;">Uraian Pekerjaan</th>
                    <th rowspan="2" style="width: 5%;">Bobot</th>
                    <!-- Looping Header Minggu Ke-X sesuai datamu di sini -->
                    @foreach($localWeeks as $w)
                        <th>M-{{ $w->minggu_ke }}</th>
                    @endforeach
                    <th rowspan="2" style="width: 7%;">Total</th>
                </tr>
            </thead>
            <tbody>
                <!-- Isi Looping Tabel Matriks RAB kamu di sini -->
                <!-- ... -->
            </tbody>
        </table>
    </div>

</body>
</html>
