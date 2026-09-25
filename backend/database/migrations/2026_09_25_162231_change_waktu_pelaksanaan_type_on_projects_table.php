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
        Schema::table('projects', function (Blueprint $table) {
            // Mengubah tipe data menjadi string (varchar)
            $table->string('waktu_pelaksanaan')->nullable()->change();
            $table->string('masa_pemeliharaan')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Mengembalikan ke integer jika di-rollback
            $table->integer('waktu_pelaksanaan')->nullable()->change();
            $table->integer('masa_pemeliharaan')->nullable()->change();
        });
    }
};
