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
        Schema::table('rab_items', function (Blueprint $table) {
            $table->boolean('is_subheader')->default(false)->after('uraian_pekerjaan');
            // Mengubah kolom angka menjadi nullable (boleh kosong) karena Sub-Header tidak punya volume & harga
            $table->string('satuan', 50)->nullable()->change();
            $table->decimal('volume', 10, 4)->nullable()->change();
            $table->decimal('harga_satuan', 20, 2)->nullable()->change();
            $table->decimal('total_harga', 20, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rab_items', function (Blueprint $table) {
            //
        });
    }
};
