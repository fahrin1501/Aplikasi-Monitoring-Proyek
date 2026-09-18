<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rab_categories', function (Blueprint $table) {
            $table->string('kode_divisi')->nullable()->after('project_id');
        });

        Schema::table('rab_items', function (Blueprint $table) {
            $table->string('kode_pekerjaan')->nullable()->after('rab_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('rab_categories', function (Blueprint $table) {
            $table->dropColumn('kode_divisi');
        });

        Schema::table('rab_items', function (Blueprint $table) {
            $table->dropColumn('kode_pekerjaan');
        });
    }
};
