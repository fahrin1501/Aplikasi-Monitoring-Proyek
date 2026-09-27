<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_schedules', function (Blueprint $table) {
            // Menambahkan kolom target_kumulatif sebelum kolom bobot_rencana
            $table->decimal('target_kumulatif', 10, 4)->default(0)->after('tanggal_akhir');
        });
    }

    public function down(): void
    {
        Schema::table('project_schedules', function (Blueprint $table) {
            $table->dropColumn('target_kumulatif');
        });
    }
};
