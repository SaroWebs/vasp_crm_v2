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
        Schema::table('task_assignments', function (Blueprint $table) {
            $table->foreignId('parent_assignment_id')
                ->nullable()
                ->after('assigned_by')
                ->constrained('task_assignments')
                ->nullOnDelete();
            $table->foreignId('unassigned_by')
                ->nullable()
                ->after('completed_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('unassigned_at')->nullable()->after('unassigned_by');

            $table->index('unassigned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_assignments', function (Blueprint $table) {
            $table->dropIndex(['unassigned_at']);
            $table->dropConstrainedForeignId('parent_assignment_id');
            $table->dropConstrainedForeignId('unassigned_by');
            $table->dropColumn('unassigned_at');
        });
    }
};
