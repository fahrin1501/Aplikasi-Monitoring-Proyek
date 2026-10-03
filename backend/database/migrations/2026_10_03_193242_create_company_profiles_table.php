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
    Schema::create('company_profiles', function (Blueprint $table) {
        $table->id();
        // Bagian Landing Page
        $table->string('hero_title')->default('Pantau Progres Secara Real-Time');
        $table->text('hero_subtitle')->nullable();
        $table->string('btn_text')->default('Sistem Manajemen Proyek');
        $table->string('hero_image')->nullable();

        // Bagian Kontak
        $table->string('email')->default('admin@prisma-group.com');
        $table->string('phone')->nullable();
        $table->string('website')->nullable();
        $table->text('address')->nullable();
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_profiles');
    }
};
