<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectSchedule extends Model
{
    use HasFactory;

    protected $table = 'project_schedules';

    // Kolom bersih tanpa beban RAB Item
    protected $fillable = [
        'project_id',
        'minggu_ke',
        'bulan',
        'tanggal_awal',
        'tanggal_akhir',
        'target_kumulatif'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
