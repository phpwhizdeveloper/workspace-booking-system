<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'workspace_id',
        'start_time',
        'end_time',
        'username',
        'email',
        'notes',
        'status',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
