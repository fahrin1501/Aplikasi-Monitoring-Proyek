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
    Schema::table('project_gis_zones', function (Blueprint $table) {
        $table->string('lokasi_wilayah')->nullable();
        $table->text('status_lahan')->nullable();
        $table->longText('geojson_data')->nullable();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_gis_zones', function (Blueprint $table) {
            //
        });
    }
};
