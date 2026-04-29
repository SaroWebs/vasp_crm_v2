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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('employee_id')->nullable();
            $table->bigInteger('machine_id')->nullable();
            $table->date('attendance_date')->nullable();
            $table->time('punch_in')->nullable();
            $table->time('punch_out')->nullable();
            $table->string('ip')->nullable();
            $table->string('employee_name')->nullable();
            $table->string('group_name')->nullable();
            $table->boolean('is_live')->default(0);
            $table->enum('mode', ['office', 'remote'])->default('office');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
