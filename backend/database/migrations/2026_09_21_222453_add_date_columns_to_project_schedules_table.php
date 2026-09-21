<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('project_schedules', function (Blueprint $table) {
        $table->integer('bulan')->nullable()->after('minggu_ke');
        $table->date('tanggal_awal')->nullable()->after('bulan');
        $table->date('tanggal_akhir')->nullable()->after('tanggal_awal');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_schedules', function (Blueprint $table) {
            //
        });
    }
};
