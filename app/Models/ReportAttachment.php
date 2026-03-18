<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportAttachment extends Model
{
    
    protected $fillable = [
        'report_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'metadata'
    ];
    
    protected $casts = [
        'metadata' => 'array'
    ];
    
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}