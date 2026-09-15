<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rab_item_id')->constrained('rab_items')->cascadeOnDelete();
            $table->integer('minggu_ke'); // Menyimpan M-1, M-2, dst
            $table->decimal('bobot_rencana', 8, 4); // Target persen (Maks: 100.0000)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_schedules');
    }
};
