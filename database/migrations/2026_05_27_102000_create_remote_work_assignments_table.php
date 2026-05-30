<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remote_work_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->text('notes')->nullable();
            $table->foreignId('assigned_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['employee_id', 'start_date', 'end_date']);
            $table->index('start_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remote_work_assignments');
    }
};
