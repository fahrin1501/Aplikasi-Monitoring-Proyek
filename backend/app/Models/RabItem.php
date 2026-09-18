<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabItem extends Model
{
    use HasFactory;

    // TAMBAHKAN 'kode_pekerjaan' di sini
    protected $fillable = [
        'rab_category_id', 'kode_pekerjaan', 'uraian_pekerjaan', 'is_subheader', 'satuan', 'volume', 'harga_satuan', 'total_harga'
    ];
}
