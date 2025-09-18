<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Workspace extends Model
{
    protected $fillable = [
        'title',
        'image',
        'description',
        'image_data',
        'image_mime',
        'image_size',
    ];
}
