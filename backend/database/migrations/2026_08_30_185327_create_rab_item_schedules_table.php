<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rab_item_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rab_item_id')->constrained('rab_items')->cascadeOnDelete();

            // Menyimpan rencana pada minggu ke-berapa (1, 2, 3, dst)
            $table->integer('minggu_ke');

            // Menyimpan target bobot (%) pada minggu tersebut
            $table->decimal('bobot_rencana', 8, 4);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rab_item_schedules');
    }
};
