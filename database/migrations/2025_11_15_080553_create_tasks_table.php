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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_code')->unique();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('task_type_id')->nullable()->constrained('task_types')->nullOnDelete();
            $table->foreignId('sla_policy_id')->nullable()->constrained('sla_policies')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->enum('current_owner_kind', ['USER', 'DEPARTMENT', 'UNASSIGNED'])->default('UNASSIGNED');
            $table->bigInteger('current_owner_id')->nullable();
            $table->enum('state', ['Draft', 'Assigned', 'InProgress', 'Blocked', 'InReview', 'Done', 'Cancelled', 'Rejected'])->default('Draft');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('estimate_hours', 5, 2)->nullable(); // Story points or hours
            $table->json('tags')->nullable(); // Flexible tagging system
            $table->integer('version')->default(1); // Optimistic concurrency token
            $table->json('metadata')->nullable();
            $table->foreignId('parent_task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->unsignedBigInteger('ticket_id')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->text('completion_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('state');
            $table->index(['current_owner_kind', 'current_owner_id']);
            $table->index('due_at');
            $table->index('project_id');
            $table->index('department_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
