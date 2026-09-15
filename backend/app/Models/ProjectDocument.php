<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectDocument extends Model
{
    protected $fillable = ['project_id', 'nama_file', 'path_file', 'ukuran'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
