<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommentAttachment extends Model
{
    protected $fillable = [
        'comment_id',
        'file_path',
        'file_type',
        'original_filename',
        'file_size',
        'uploaded_by_type',
        'uploaded_by',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class);
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->file_type, 'image/');
    }
}