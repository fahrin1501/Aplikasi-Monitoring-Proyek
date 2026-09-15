<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Mengubah kolom menjadi boleh kosong (nullable)
            $table->string('kategori')->nullable()->change();
            $table->text('deskripsi')->nullable()->change();
            $table->string('kode_kontrak')->nullable()->change();
            $table->string('sumber_dana')->nullable()->change();
            $table->string('waktu_pelaksanaan')->nullable()->change();
            $table->string('masa_pemeliharaan')->nullable()->change();
            $table->string('ppk')->nullable()->change();
            $table->string('kontraktor')->nullable()->change();
            $table->string('konsultan')->nullable()->change();
            $table->date('tanggal_mulai')->nullable()->change();
            $table->date('tanggal_selesai')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Opsional untuk rollback
    }
};
