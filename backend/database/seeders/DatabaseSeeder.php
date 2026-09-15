<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Menggunakan updateOrCreate agar tidak error duplikat jika di-seed berulang kali
        User::updateOrCreate(
            ['email' => 'superadministrator123@gmail.com'], // Kondisi pencarian
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('123456'),
                // 'role' => 'admin', // (Buka komentar ini JIKA di tabel users Anda ada kolom 'role')
            ]
        );
    }
}
