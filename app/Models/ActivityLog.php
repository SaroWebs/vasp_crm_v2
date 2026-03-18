<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $guarded = [];
    
    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the subject of the activity log.
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the causer of the activity log.
     */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who caused the activity (if causer is a User).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    /**
     * Scope to filter by log name.
     */
    public function scopeLogName($query, $logName)
    {
        return $query->where('log_name', $logName);
    }

    /**
     * Scope to filter by subject type.
     */
    public function scopeSubjectType($query, $subjectType)
    {
        return $query->where('subject_type', $subjectType);
    }

    /**
     * Scope to filter by subject ID.
     */
    public function scopeSubjectId($query, $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    /**
     * Scope to filter by causer type.
     */
    public function scopeCauserId($query, $causerId)
    {
        return $query->where('causer_id', $causerId);
    }

    /**
     * Scope to filter by causer type.
     */
    public function scopeCauserType($query, $causerType)
    {
        return $query->where('causer_type', $causerType);
    }

    /**
     * Scope to filter by description.
     */
    public function scopeDescription($query, $description)
    {
        return $query->where('description', 'like', '%' . $description . '%');
    }

    /**
     * Scope to get logs for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('causer_id', $userId)
                     ->where('causer_type', 'App\Models\User');
    }

    /**
     * Scope to get logs for a specific model.
     */
    public function scopeForModel($query, $model)
    {
        return $query->where('subject_type', get_class($model))
                     ->where('subject_id', $model->id);
    }

    /**
     * Scope to get logs within a date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Get the properties as a formatted array.
     */
    public function getFormattedPropertiesAttribute()
    {
        return $this->properties ?? [];
    }

    /**
     * Get the activity type (create, update, delete, etc.).
     */
    public function getActivityTypeAttribute()
    {
        $description = strtolower($this->description);
        
        if (str_contains($description, 'created')) {
            return 'create';
        } elseif (str_contains($description, 'updated')) {
            return 'update';
        } elseif (str_contains($description, 'deleted')) {
            return 'delete';
        } elseif (str_contains($description, 'assigned')) {
            return 'assign';
        } elseif (str_contains($description, 'removed')) {
            return 'remove';
        } elseif (str_contains($description, 'accepted')) {
            return 'accept';
        } elseif (str_contains($description, 'rejected')) {
            return 'reject';
        }
        
        return 'other';
    }

    /**
     * Get the activity icon based on type.
     */
    public function getActivityIconAttribute()
    {
        $icons = [
            'create' => 'plus-circle',
            'update' => 'edit',
            'delete' => 'trash',
            'assign' => 'user-plus',
            'remove' => 'user-minus',
            'accept' => 'check-circle',
            'reject' => 'x-circle',
            'other' => 'activity'
        ];

        return $icons[$this->activityType] ?? 'activity';
    }

    /**
     * Get the activity color based on type.
     */
    public function getActivityColorAttribute()
    {
        $colors = [
            'create' => 'green',
            'update' => 'blue',
            'delete' => 'red',
            'assign' => 'purple',
            'remove' => 'orange',
            'accept' => 'green',
            'reject' => 'red',
            'other' => 'gray'
        ];

        return $colors[$this->activityType] ?? 'gray';
    }

    /**
     * Create a new activity log entry.
     */
    public static function log($description, $subject = null, $causer = null, $properties = [], $logName = 'default')
    {
        $causer = $causer ?? \Illuminate\Support\Facades\Auth::user();
        
        return self::create([
            'log_name' => $logName,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'causer_type' => $causer ? get_class($causer) : null,
            'causer_id' => $causer ? $causer->id : null,
            'properties' => $properties
        ]);
    }

    /**
     * Log a model creation.
     */
    public static function logCreate($model, $causer = null, $properties = [])
    {
        return self::log(
            "Created {$model->getLogName()}",
            $model,
            $causer,
            array_merge($properties, ['action' => 'create']),
            $model->getLogName()
        );
    }

    /**
     * Log a model update.
     */
    public static function logUpdate($model, $causer = null, $properties = [])
    {
        return self::log(
            "Updated {$model->getLogName()}",
            $model,
            $causer,
            array_merge($properties, ['action' => 'update']),
            $model->getLogName()
        );
    }

    /**
     * Log a model deletion.
     */
    public static function logDelete($model, $causer = null, $properties = [])
    {
        return self::log(
            "Deleted {$model->getLogName()}",
            $model,
            $causer,
            array_merge($properties, ['action' => 'delete']),
            $model->getLogName()
        );
    }

    /**
     * Log a custom action.
     */
    public static function logAction($description, $subject = null, $causer = null, $properties = [], $logName = 'default')
    {
        return self::log($description, $subject, $causer, $properties, $logName);
    }
}
