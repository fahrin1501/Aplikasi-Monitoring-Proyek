<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Mengecek dan menghapus kolom satu per satu jika memang ada di tabel projects
            $columnsToDrop = [
                'lat_awal',
                'long_awal',
                'lat_akhir',
                'long_akhir',
                'lokasi_wilayah',
                'status_lahan',
                'geojson_data'
            ];

            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('projects', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        // Jika di-rollback, kolom akan dikembalikan (opsional untuk keamanan)
        Schema::table('projects', function (Blueprint $table) {
            $table->string('lat_awal')->nullable();
            $table->string('long_awal')->nullable();
            $table->string('lat_akhir')->nullable();
            $table->string('long_akhir')->nullable();
            $table->string('lokasi_wilayah')->nullable();
            $table->text('status_lahan')->nullable();
            $table->longText('geojson_data')->nullable();
        });
    }
};
