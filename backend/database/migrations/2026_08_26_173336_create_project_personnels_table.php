<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_personnels', function (Blueprint $table) {
            $table->id();
            // Relasi ke tabel projects (Jika proyek dihapus, personel otomatis terhapus)
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('nama');
            $table->string('peran'); // ex: Site Manager, QC, K3
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_personnels');
    }
};
