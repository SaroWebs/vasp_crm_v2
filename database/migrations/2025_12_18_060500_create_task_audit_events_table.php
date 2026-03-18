<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->timestamp('occurred_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->foreignId('actor_user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // ASSIGN, REASSIGN, STATE_CHANGE, etc.
            
            // State transitions
            $table->string('from_state')->nullable();
            $table->string('to_state')->nullable();
            
            // Ownership changes
            $table->enum('from_owner_kind', ['USER', 'DEPARTMENT', 'UNASSIGNED'])->nullable();
            $table->bigInteger('from_owner_id')->nullable();
            $table->enum('to_owner_kind', ['USER', 'DEPARTMENT', 'UNASSIGNED'])->nullable();
            $table->bigInteger('to_owner_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            // SLA snapshots
            $table->json('sla_snapshot')->nullable();
            
            // Context
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            
            $table->index(['task_id', 'occurred_at']);
            $table->index('actor_user_id');
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_audit_events');
    }
};
