<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Tambah kolom minggu_ke di tabel daily_reports
        Schema::table('daily_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_reports', 'minggu_ke')) {
                // Tipe Integer karena berisi angka minggu (1, 2, 3, dst)
                $table->integer('minggu_ke')->nullable()->after('tanggal');
            }
        });

        // 2. Tambah kolom persentase di tabel daily_report_activities
        Schema::table('daily_report_activities', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_report_activities', 'persentase')) {
                // Tipe Decimal (10,4) untuk menampung angka koma yang panjang dengan aman (misal: 12.5000)
                $table->decimal('persentase', 10, 4)->nullable()->after('satuan');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            if (Schema::hasColumn('daily_reports', 'minggu_ke')) {
                $table->dropColumn('minggu_ke');
            }
        });

        Schema::table('daily_report_activities', function (Blueprint $table) {
            if (Schema::hasColumn('daily_report_activities', 'persentase')) {
                $table->dropColumn('persentase');
            }
        });
    }
};
