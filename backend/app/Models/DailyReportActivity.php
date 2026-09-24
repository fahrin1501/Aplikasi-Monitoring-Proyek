<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DailyReportActivity extends Model {
    protected $table = 'daily_report_activities';
    protected $fillable = ['daily_report_id', 'rab_item_id', 'uraian', 'sta_awal', 'sta_akhir', 'volume', 'satuan', 'persentase'];

    // TAMBAHKAN FUNGSI INI AGAR BACKEND BISA MENARIK DATA DEVISI RAB
    public function rabItem()
    {
        return $this->belongsTo(RabItem::class, 'rab_item_id');
    }
}
