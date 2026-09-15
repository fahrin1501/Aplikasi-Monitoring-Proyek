<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_gis_zones', function (Blueprint $table) {
            // 1. Hapus 4 kolom koordinat yang lama
            $table->dropColumn(['lat_awal', 'long_awal', 'lat_akhir', 'long_akhir']);

            // 2. Buat 2 kolom baru bertipe string untuk menampung format "-3.300230, 114.595202"
            $table->string('koordinat_awal')->nullable()->after('project_id');
            $table->string('koordinat_akhir')->nullable()->after('koordinat_awal');
        });
    }

    public function down(): void
    {
        Schema::table('project_gis_zones', function (Blueprint $table) {
            // Rollback: Hapus kolom baru dan kembalikan kolom lama
            $table->dropColumn(['koordinat_awal', 'koordinat_akhir']);

            $table->string('lat_awal')->nullable();
            $table->string('long_awal')->nullable();
            $table->string('lat_akhir')->nullable();
            $table->string('long_akhir')->nullable();
        });
    }
};
