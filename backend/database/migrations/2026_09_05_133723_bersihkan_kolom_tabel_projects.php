<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Membuang kolom SPMK dan semua Latitude/Longitude yang pernah ada
            $table->dropColumn([
                'nomor_spmk',
                'latitude',
                'longitude',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('nomor_spmk')->nullable();
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
        });
    }
};
