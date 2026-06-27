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
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['status', 'updated_at'], 'tickets_status_updated_at_idx');
            $table->index('created_at', 'tickets_created_at_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['state', 'updated_at'], 'tasks_state_updated_at_idx');
            $table->index('created_at', 'tasks_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_status_updated_at_idx');
            $table->dropIndex('tickets_created_at_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_state_updated_at_idx');
            $table->dropIndex('tasks_created_at_idx');
        });
    }
};
