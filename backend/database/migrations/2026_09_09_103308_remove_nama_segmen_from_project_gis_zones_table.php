<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_gis_zones', function (Blueprint $table) {
            if (Schema::hasColumn('project_gis_zones', 'nama_segmen')) {
                $table->dropColumn('nama_segmen');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_gis_zones', function (Blueprint $table) {
            $table->string('nama_segmen')->nullable();
        });
    }
};
