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
            // Add indexes for frequent queries on tickets
            $table->index('status');
            $table->index('client_id');
            $table->index('deleted_at');
        });

        Schema::table('tasks', function (Blueprint $table) {
            // Add index for work status and ticket relationship
            $table->index(['ticket_id', 'state']);
        });

        Schema::table('user_permissions', function (Blueprint $table) {
            // Add index for user permissions query
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['client_id']);
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['ticket_id', 'state']);
        });

        Schema::table('user_permissions', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
