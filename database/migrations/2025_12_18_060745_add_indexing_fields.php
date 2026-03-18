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
        // Create indexes for better performance
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['status', 'priority'], 'tickets_status_priority_idx');
            $table->index(['client_id', 'status'], 'tickets_client_status_idx');
            $table->index('approved_by', 'tickets_approved_by_idx');
            $table->index('rejected_by', 'tickets_rejected_by_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['assigned_department_id', 'state'], 'tasks_assigned_department_state_idx');
            $table->index(['assigned_to', 'state'], 'tasks_assigned_to_state_idx');
            $table->index('ticket_id', 'tasks_ticket_id_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('status', 'users_status_idx');
            $table->index('last_login_at', 'users_last_login_at_idx');
        });

        Schema::table('department_users', function (Blueprint $table) {
            $table->index(['user_id', 'department_id'], 'department_users_user_department_idx');
            $table->index('assigned_at', 'department_users_assigned_at_idx');
            $table->index('assigned_by', 'department_users_assigned_by_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes first
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_status_priority_idx');
            $table->dropIndex('tickets_client_status_idx');
            $table->dropIndex('tickets_approved_by_idx');
            $table->dropIndex('tickets_rejected_by_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_assigned_department_state_idx');
            $table->dropIndex('tasks_assigned_to_state_idx');
            $table->dropIndex('tasks_ticket_id_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_status_idx');
            $table->dropIndex('users_last_login_at_idx');
        });

        Schema::table('department_users', function (Blueprint $table) {
            $table->dropIndex('department_users_user_department_idx');
            $table->dropIndex('department_users_assigned_at_idx');
            $table->dropIndex('department_users_assigned_by_idx');
        });

    }
};
