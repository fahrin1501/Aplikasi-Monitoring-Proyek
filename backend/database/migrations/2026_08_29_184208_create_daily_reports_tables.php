<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Induk Laporan
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->date('tanggal');
            $table->string('pengawas');
            $table->string('lokasi');
            $table->string('cuaca_cerah')->nullable();
            $table->string('cuaca_gerimis')->nullable();
            $table->string('cuaca_hujan')->nullable();
            $table->timestamps();
        });

        // 2. Tabel Kegiatan & Volume
        Schema::create('daily_report_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->onDelete('cascade');
            $table->text('uraian');
            $table->string('sta_awal')->nullable();
            $table->string('sta_akhir')->nullable();
            $table->decimal('volume', 10, 4)->nullable();
            $table->string('satuan', 50)->nullable();
            $table->timestamps();
        });

        // 3. Tabel Personil
        Schema::create('daily_report_personnels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->onDelete('cascade');
            $table->string('peran');
            $table->integer('jumlah');
            $table->timestamps();
        });

        // 4. Tabel Peralatan
        Schema::create('daily_report_equipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->onDelete('cascade');
            $table->string('nama_alat');
            $table->integer('jumlah');
            $table->timestamps();
        });

        // 5. Tabel Lampiran (Foto & Dokumen)
        Schema::create('daily_report_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->onDelete('cascade');
            $table->enum('tipe', ['foto', 'dokumen']);
            $table->string('nama_file');
            $table->string('path_file');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_report_attachments');
        Schema::dropIfExists('daily_report_equipments');
        Schema::dropIfExists('daily_report_personnels');
        Schema::dropIfExists('daily_report_activities');
        Schema::dropIfExists('daily_reports');
    }
};
