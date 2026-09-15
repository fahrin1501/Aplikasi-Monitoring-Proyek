<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabItemSchedule extends Model
{
    protected $table = 'rab_item_schedules';

    protected $fillable = [
        'project_id',
        'rab_item_id',
        'minggu_ke',
        'bobot_rencana'
    ];

    public function project() {
        return $this->belongsTo(Project::class);
    }

    public function rabItem() {
        return $this->belongsTo(RabItem::class);
    }
}
