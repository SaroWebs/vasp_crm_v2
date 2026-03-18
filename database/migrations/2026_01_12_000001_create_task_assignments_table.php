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
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('assigned_at')->useCurrent();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('assignment_notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->decimal('estimated_time', 8, 2)->nullable();
            $table->enum('state', ['pending', 'accepted', 'in_progress', 'completed', 'rejected'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            // Add unique constraint to prevent duplicate assignments
            $table->unique(['task_id', 'user_id']);

            // Add indexes for performance
            $table->index('task_id');
            $table->index('user_id');
            $table->index('is_active');
            $table->index('assigned_at');
            $table->index('state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_assignments');
    }
};