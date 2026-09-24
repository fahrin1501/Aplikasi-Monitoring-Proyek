<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'tanggal', 'minggu_ke', 'pengawas', 'lokasi',
        'cuaca', 'kondisi_cuaca', 'status', 'verified_at'
    ];

    public function project() {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function activities() { return $this->hasMany(DailyReportActivity::class); }
    public function personnels() { return $this->hasMany(DailyReportPersonnel::class); }
    public function equipments() { return $this->hasMany(DailyReportEquipment::class); }
    public function attachments() { return $this->hasMany(DailyReportAttachment::class); }
}
