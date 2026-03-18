<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserSkill extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'skill_name',
        'skill_level',
        'years_of_experience',
        'certification',
        'is_primary',
        'skill_category',
        'proficiency_score',
        'last_used',
        'skill_description',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'years_of_experience' => 'integer',
        'proficiency_score' => 'integer',
        'last_used' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the skill.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by skill category.
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('skill_category', $category);
    }

    /**
     * Scope to filter by skill level.
     */
    public function scopeLevel($query, $level)
    {
        return $query->where('skill_level', $level);
    }

    /**
     * Scope to get primary skills.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to filter by proficiency score range.
     */
    public function scopeProficiencyRange($query, $minScore, $maxScore)
    {
        return $query->whereBetween('proficiency_score', [$minScore, $maxScore]);
    }

    /**
     * Create a new user skill.
     */
    public static function createSkill($userId, $skillName, $skillLevel, $yearsOfExperience = 0, $certification = null, $isPrimary = false, $skillCategory = null, $proficiencyScore = 0, $lastUsed = null, $skillDescription = null)
    {
        return self::create([
            'user_id' => $userId,
            'skill_name' => $skillName,
            'skill_level' => $skillLevel,
            'years_of_experience' => $yearsOfExperience,
            'certification' => $certification,
            'is_primary' => $isPrimary,
            'skill_category' => $skillCategory,
            'proficiency_score' => $proficiencyScore,
            'last_used' => $lastUsed,
            'skill_description' => $skillDescription,
        ]);
    }

    /**
     * Get skills for a user.
     */
    public static function getUserSkills($userId)
    {
        return self::where('user_id', $userId)
            ->orderBy('is_primary', 'desc')
            ->orderBy('proficiency_score', 'desc')
            ->get();
    }

    /**
     * Get primary skills for a user.
     */
    public static function getPrimarySkills($userId)
    {
        return self::where('user_id', $userId)
            ->where('is_primary', true)
            ->orderBy('proficiency_score', 'desc')
            ->get();
    }

    /**
     * Get skills by category for a user.
     */
    public static function getSkillsByCategory($userId, $category)
    {
        return self::where('user_id', $userId)
            ->where('skill_category', $category)
            ->orderBy('proficiency_score', 'desc')
            ->get();
    }

    /**
     * Get skills matching task requirements.
     */
    public static function getMatchingSkills($taskRequirements)
    {
        $skills = self::whereIn('skill_name', $taskRequirements)
            ->with('user')
            ->get();

        return $skills->groupBy('user_id');
    }

    /**
     * Update skill proficiency based on task completion.
     */
    public function updateProficiency($taskCompletionScore)
    {
        // Simple proficiency update logic
        $newScore = $this->proficiency_score + ($taskCompletionScore * 0.1);
        $this->proficiency_score = min(100, max(0, $newScore));
        $this->last_used = now();
        $this->years_of_experience = $this->calculateYearsOfExperience();
        $this->save();
    }

    /**
     * Calculate years of experience based on last used date.
     */
    private function calculateYearsOfExperience()
    {
        if (!$this->last_used) {
            return $this->years_of_experience;
        }

        $years = now()->diffInYears($this->last_used);
        return max($this->years_of_experience, $years);
    }

    /**
     * Get skill level display text.
     */
    public function getLevelDisplayAttribute()
    {
        $levels = [
            'beginner' => 'Beginner',
            'intermediate' => 'Intermediate',
            'advanced' => 'Advanced',
            'expert' => 'Expert',
        ];

        return $levels[$this->skill_level] ?? ucfirst($this->skill_level);
    }

    /**
     * Check if skill matches requirements.
     */
    public function matchesRequirements($requiredLevel, $requiredScore)
    {
        $levelOrder = ['beginner' => 1, 'intermediate' => 2, 'advanced' => 3, 'expert' => 4];
        
        $currentLevelOrder = $levelOrder[$this->skill_level] ?? 0;
        $requiredLevelOrder = $levelOrder[$requiredLevel] ?? 0;

        return $currentLevelOrder >= $requiredLevelOrder && $this->proficiency_score >= $requiredScore;
    }
}
