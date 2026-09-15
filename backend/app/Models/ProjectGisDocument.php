<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectGisDocument extends Model
{
    use HasFactory;
    protected $fillable = ['project_id', 'nama_file', 'path_file', 'ukuran'];
}
