<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            // 1. Hapus 3 kolom cuaca yang lama
            $table->dropColumn(['cuaca_cerah', 'cuaca_gerimis', 'cuaca_hujan']);

            // 2. Buat 1 kolom cuaca baru (tipe teks agar bisa menampung tulisan panjang)
            $table->text('cuaca')->nullable()->after('lokasi');
        });
    }

    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropColumn('cuaca');
            $table->string('cuaca_cerah')->nullable();
            $table->string('cuaca_gerimis')->nullable();
            $table->string('cuaca_hujan')->nullable();
        });
    }
};
