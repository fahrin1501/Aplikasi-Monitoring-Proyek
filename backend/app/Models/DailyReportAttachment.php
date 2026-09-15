<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DailyReportAttachment extends Model {
    protected $table = 'daily_report_attachments'; // Kunci nama tabel
    protected $fillable = ['daily_report_id', 'tipe', 'nama_file', 'path_file'];
}
