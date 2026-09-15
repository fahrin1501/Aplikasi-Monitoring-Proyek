<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectSchedule extends Model
{
    use HasFactory;

    protected $table = 'project_schedules';

    protected $fillable = [
        'project_id',
        'rab_item_id',
        'minggu_ke',
        'bobot_rencana'
    ];

    // Relasi ke Proyek
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Relasi ke Item RAB
    public function rabItem()
    {
        return $this->belongsTo(RabItem::class);
    }
}
