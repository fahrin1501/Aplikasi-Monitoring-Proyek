<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabCategory extends Model
{
    use HasFactory;

    protected $fillable = ['project_id', 'nama_kategori'];

    // Relasi: 1 Kategori memiliki Banyak Item
    public function items()
    {
        return $this->hasMany(RabItem::class, 'rab_category_id');
    }
}
