<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DailyReportPersonnel extends Model {
    // Beri tahu Laravel nama tabel aslinya secara paksa
    protected $table = 'daily_report_personnels';

    protected $fillable = ['daily_report_id', 'peran', 'jumlah'];
}
