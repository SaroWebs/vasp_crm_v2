<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds milestone-specific columns to timeline_events table
     * to support task milestone tracking for admin oversight.
     */
    public function up(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            // Milestone type: start, checkpoint, completion, deadline
            $table->enum('milestone_type', ['start', 'checkpoint', 'completion', 'deadline'])
                ->nullable()
                ->after('is_milestone')
                ->comment('Type of milestone: start, checkpoint, completion, or deadline');
            
            // Target date for the milestone (when it should be achieved)
            $table->dateTime('target_date')
                ->nullable()
                ->after('milestone_type')
                ->comment('Expected date for milestone completion');
            
            // Whether the milestone has been achieved
            $table->boolean('is_completed')
                ->default(false)
                ->after('target_date')
                ->comment('Whether the milestone has been completed');
            
            // When the milestone was actually completed
            $table->dateTime('completed_at')
                ->nullable()
                ->after('is_completed')
                ->comment('Actual completion date of the milestone');
            
            // Progress percentage at this milestone (0-100)
            $table->integer('progress_percentage')
                ->default(0)
                ->after('completed_at')
                ->comment('Progress percentage at this milestone (0-100)');
            
            // Add index for milestone queries
            $table->index(['is_milestone', 'is_completed'], 'timeline_events_milestone_status_idx');
            $table->index('target_date', 'timeline_events_target_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropIndex('timeline_events_milestone_status_idx');
            $table->dropIndex('timeline_events_target_date_idx');
            
            $table->dropColumn([
                'milestone_type',
                'target_date',
                'is_completed',
                'completed_at',
                'progress_percentage',
            ]);
        });
    }
};
