<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('nama_proyek');
            $table->string('kategori');
            $table->string('kode_kontrak');
            $table->string('nomor_spmk');
            $table->string('sumber_dana')->nullable();
            $table->string('tahun_anggaran', 4)->nullable();
            $table->decimal('nilai_kontrak', 20, 2); // Kapasitas 20 digit untuk nilai triliunan
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->string('waktu_pelaksanaan')->nullable();
            $table->string('masa_pemeliharaan')->nullable();
            $table->string('lokasi_wilayah')->nullable();
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->string('ppk')->nullable();
            $table->string('kontraktor')->nullable();
            $table->string('konsultan')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('status')->default('Persiapan'); // Persiapan, Berjalan, Selesai
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
