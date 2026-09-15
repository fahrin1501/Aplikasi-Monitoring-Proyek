<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectGisZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'koordinat_awal',
        'koordinat_akhir',
        'status_lahan',
        'geojson_data'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
