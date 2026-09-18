<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabCategory extends Model
{
    use HasFactory;

    // TAMBAHKAN 'kode_divisi' di sini
    protected $fillable = ['project_id', 'kode_divisi', 'nama_kategori'];

    public function items()
    {
        return $this->hasMany(RabItem::class, 'rab_category_id');
    }
}
