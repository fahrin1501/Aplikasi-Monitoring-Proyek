<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. KEMBALIKAN lokasi_wilayah KE TABEL projects
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'lokasi_wilayah')) {
                $table->string('lokasi_wilayah')->nullable();
            }
        });

        // 2. BERSIHKAN TABEL project_gis_zones (Hapus yang tidak perlu)
        Schema::table('project_gis_zones', function (Blueprint $table) {
            // Hapus nama_segmen jika masih ada
            if (Schema::hasColumn('project_gis_zones', 'nama_segmen')) {
                $table->dropColumn('nama_segmen');
            }
            // Hapus lokasi_wilayah dari sini (karena sudah pindah ke projects)
            if (Schema::hasColumn('project_gis_zones', 'lokasi_wilayah')) {
                $table->dropColumn('lokasi_wilayah');
            }

            // Pastikan kolom-kolom utama GIS ada (Jika belum)
            if (!Schema::hasColumn('project_gis_zones', 'lat_awal')) {
                $table->string('lat_awal')->nullable();
                $table->string('long_awal')->nullable();
                $table->string('lat_akhir')->nullable();
                $table->string('long_akhir')->nullable();
                $table->text('status_lahan')->nullable();
                $table->longText('geojson_data')->nullable();
            }
        });
    }

    public function down(): void
    {
        // ... opsional untuk rollback
    }
};
