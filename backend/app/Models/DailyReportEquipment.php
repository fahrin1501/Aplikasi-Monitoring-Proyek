<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DailyReportEquipment extends Model {
    // Beri tahu Laravel nama tabel aslinya secara paksa
    protected $table = 'daily_report_equipments';

    protected $fillable = ['daily_report_id', 'nama_alat', 'jumlah'];
}
