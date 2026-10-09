<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            // Index komposit untuk query status per proyek
            $table->index(['project_id', 'status'], 'idx_reports_project_status');
            $table->index('tanggal', 'idx_reports_tanggal');
            $table->index('minggu_ke', 'idx_reports_minggu');
        });

        Schema::table('daily_report_activities', function (Blueprint $table) {
            // Index foreign key untuk kalkulasi JOIN & agregasi
            $table->index('daily_report_id', 'idx_activities_report_id');
            $table->index('rab_item_id', 'idx_activities_rab_item_id');
        });

        Schema::table('rab_categories', function (Blueprint $table) {
            $table->index('project_id', 'idx_rab_categories_project');
        });

        Schema::table('rab_items', function (Blueprint $table) {
            $table->index('rab_category_id', 'idx_rab_items_category');
            $table->index('is_subheader', 'idx_rab_items_subheader');
        });

        Schema::table('project_schedules', function (Blueprint $table) {
            $table->index(['project_id', 'minggu_ke'], 'idx_schedules_project_minggu');
        });
    }

    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropIndex('idx_reports_project_status');
            $table->dropIndex('idx_reports_tanggal');
            $table->dropIndex('idx_reports_minggu');
        });

        Schema::table('daily_report_activities', function (Blueprint $table) {
            $table->dropIndex('idx_activities_report_id');
            $table->dropIndex('idx_activities_rab_item_id');
        });

        Schema::table('rab_categories', function (Blueprint $table) {
            $table->dropIndex('idx_rab_categories_project');
        });

        Schema::table('rab_items', function (Blueprint $table) {
            $table->dropIndex('idx_rab_items_category');
            $table->dropIndex('idx_rab_items_subheader');
        });

        Schema::table('project_schedules', function (Blueprint $table) {
            $table->dropIndex('idx_schedules_project_minggu');
        });
    }
};
