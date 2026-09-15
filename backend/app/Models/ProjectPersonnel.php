<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectPersonnel extends Model
{
    use HasFactory;

    // Pastikan tabelnya sesuai (jika nama tabel di database Anda 'project_personnels')
    protected $table = 'project_personnels';

    // Wajib ada agar data dari React bisa masuk ke database
    protected $fillable = [
        'project_id',
        'nama',
        'peran'
    ];
}
