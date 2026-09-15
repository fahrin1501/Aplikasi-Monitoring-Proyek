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
        Schema::table('daily_report_activities', function (Blueprint $table) {
            // Nullable karena bisa saja ada pekerjaan tambahan di luar RAB (pekerjaan tambah kurang/CCO)
            $table->foreignId('rab_item_id')->nullable()->after('daily_report_id')->constrained('rab_items')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_report_activities', function (Blueprint $table) {
            //
        });
    }
};
