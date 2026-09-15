<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_gis_zones', function (Blueprint $table) {
            $table->id();
            // Relasi ke tabel projects (Jika proyek dihapus, zona otomatis terhapus)
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');

            $table->string('nama_segmen');
            $table->string('lat_awal')->nullable();
            $table->string('long_awal')->nullable();
            $table->string('lat_akhir')->nullable();
            $table->string('long_akhir')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_gis_zones');
    }
};
