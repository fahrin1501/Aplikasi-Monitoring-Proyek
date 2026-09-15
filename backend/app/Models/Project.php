<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    // WAJIB: Daftarkan semua kolom agar tidak diblokir oleh Laravel
    protected $fillable = [
        'nama_proyek',
        'kategori',
        'kode_kontrak',
        'nomor_kontrak_kontraktor',
        'nilai_kontrak',
        'sumber_dana',
        'tahun_anggaran',
        'tanggal_mulai',
        'tanggal_selesai',
        'waktu_pelaksanaan',
        'masa_pemeliharaan',
        'lokasi_wilayah',
        'ppk',
        'kontraktor',
        'konsultan',
        'deskripsi',
        'status',
        'foto_sampul'
    ];

    // Relasi: Proyek memiliki banyak Personel
    public function personnels()
    {
        return $this->hasMany(ProjectPersonnel::class);
    }

    // Relasi: Proyek memiliki banyak Dokumen
    public function documents()
    {
        return $this->hasMany(ProjectDocument::class);
    }

    public function rabCategories()
    {
        return $this->hasMany(RabCategory::class);
    }

    public function gisDocuments()
    {
        return $this->hasMany(ProjectGisDocument::class, 'project_id');
    }
}
