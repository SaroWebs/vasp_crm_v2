<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_work_assignments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
                ->default('approved')
                ->after('notes');
            $table->foreignId('approved_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete()
                ->after('status');
            $table->text('approval_notes')->nullable()->after('approved_by_user_id');
            $table->timestamp('decided_at')->nullable()->after('approval_notes');
        });
    }

    public function down(): void
    {
        Schema::table('field_work_assignments', function (Blueprint $table) {
            $table->dropForeign(['approved_by_user_id']);
            $table->dropColumn(['status', 'approved_by_user_id', 'approval_notes', 'decided_at']);
        });
    }
};
