<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('phase_id')->nullable()
                ->constrained('project_phases')->onDelete('set null');
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->onDelete('set null');
            $table->string('event_type');
            $table->string('event_name');
            $table->text('event_description')->nullable();
            $table->datetime('event_date');
            $table->boolean('is_milestone')->default(false);
            $table->string('milestone_type')->nullable();
            $table->date('target_date')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->datetime('completed_at')->nullable();
            $table->integer('progress_percentage')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for common queries
            $table->index(['project_id', 'event_date']);
            $table->index(['project_id', 'event_type']);
            $table->index(['project_id', 'is_milestone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_timeline_events');
    }
};
