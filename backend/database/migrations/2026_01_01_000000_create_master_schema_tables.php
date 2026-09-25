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
        // ==========================================
        // 1. TABEL SISTEM & AUTENTIKASI (DIPERBAIKI)
        // ==========================================
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('Tamu');
            $table->string('status')->default('Aktif');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // INI TABEL YANG SEBELUMNYA TERLEWAT
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('company_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        // ==========================================
        // 2. TABEL MASTER PROYEK
        // ==========================================
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('nama_proyek');
            $table->string('kategori')->nullable();
            $table->string('kode_kontrak')->nullable();
            $table->string('nomor_kontrak_kontraktor')->nullable();
            $table->decimal('nilai_kontrak', 20, 2)->nullable();
            $table->string('sumber_dana')->nullable();
            $table->string('tahun_anggaran')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->integer('waktu_pelaksanaan')->nullable();
            $table->integer('masa_pemeliharaan')->nullable();
            $table->string('lokasi_wilayah')->nullable();
            $table->string('ppk')->nullable();
            $table->string('kontraktor')->nullable();
            $table->string('konsultan')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('status')->default('Persiapan');
            $table->string('foto_sampul')->nullable();
            $table->timestamps();
        });

        Schema::create('project_personnels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('nama');
            $table->string('peran');
            $table->timestamps();
        });

        Schema::create('project_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('nama_file');
            $table->string('path_file');
            $table->string('ukuran')->nullable();
            $table->timestamps();
        });

        Schema::create('project_gis_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('nama_file');
            $table->string('path_file');
            $table->string('ukuran')->nullable();
            $table->timestamps();
        });

        Schema::create('project_gis_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('koordinat_awal')->nullable();
            $table->string('koordinat_akhir')->nullable();
            $table->string('status_lahan')->nullable();
            $table->longText('geojson_data')->nullable();
            $table->timestamps();
        });

        // ==========================================
        // 3. TABEL RAB & TIME SCHEDULE
        // ==========================================
        Schema::create('rab_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('kode_divisi')->nullable();
            $table->string('nama_kategori');
            $table->timestamps();
        });

        Schema::create('rab_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rab_category_id')->constrained('rab_categories')->cascadeOnDelete();
            $table->string('kode_pekerjaan')->nullable();
            $table->text('uraian_pekerjaan');
            $table->boolean('is_subheader')->default(false);
            $table->string('satuan')->nullable();
            $table->decimal('volume', 15, 4)->nullable();
            $table->decimal('harga_satuan', 20, 2)->nullable();
            $table->decimal('total_harga', 20, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('project_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('rab_item_id')->constrained('rab_items')->cascadeOnDelete();
            $table->integer('minggu_ke');
            $table->integer('bulan')->nullable();
            $table->date('tanggal_awal')->nullable();
            $table->date('tanggal_akhir')->nullable();
            $table->decimal('bobot_rencana', 10, 4)->default(0);
            $table->timestamps();
        });

        // ==========================================
        // 4. TABEL LAPORAN HARIAN (DAILY REPORTS)
        // ==========================================
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->date('tanggal');
            $table->integer('minggu_ke')->nullable();
            $table->string('pengawas');
            $table->string('lokasi');
            $table->text('cuaca')->nullable();
            $table->json('kondisi_cuaca')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_report_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained('daily_reports')->cascadeOnDelete();
            $table->foreignId('rab_item_id')->nullable()->constrained('rab_items')->nullOnDelete();
            $table->text('uraian');
            $table->string('sta_awal')->nullable();
            $table->string('sta_akhir')->nullable();
            $table->decimal('volume', 15, 4)->nullable();
            $table->string('satuan')->nullable();
            $table->decimal('persentase', 10, 4)->nullable();
            $table->timestamps();
        });

        Schema::create('daily_report_equipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained('daily_reports')->cascadeOnDelete();
            $table->string('nama_alat');
            $table->integer('jumlah');
            $table->timestamps();
        });

        Schema::create('daily_report_personnels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained('daily_reports')->cascadeOnDelete();
            $table->string('peran');
            $table->integer('jumlah');
            $table->timestamps();
        });

        Schema::create('daily_report_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained('daily_reports')->cascadeOnDelete();
            $table->string('tipe'); // foto atau dokumen
            $table->string('nama_file');
            $table->string('path_file');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_report_attachments');
        Schema::dropIfExists('daily_report_personnels');
        Schema::dropIfExists('daily_report_equipments');
        Schema::dropIfExists('daily_report_activities');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('project_schedules');
        Schema::dropIfExists('rab_items');
        Schema::dropIfExists('rab_categories');
        Schema::dropIfExists('project_gis_zones');
        Schema::dropIfExists('project_gis_documents');
        Schema::dropIfExists('project_documents');
        Schema::dropIfExists('project_personnels');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('company_profiles');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
