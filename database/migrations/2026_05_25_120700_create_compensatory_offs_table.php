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
        Schema::create('compensatory_offs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->decimal('comp_off_hours', 10, 2);
            $table->foreignId('source_holiday_work_id')->nullable()->constrained('holiday_work_records')->nullOnDelete();
            $table->foreignId('used_for_leave_request_id')->nullable()->constrained('leave_requests')->nullOnDelete();
            $table->enum('status', ['available', 'used', 'expired'])->default('available');
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'status']);
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compensatory_offs');
    }
};
