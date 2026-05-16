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
        Schema::create('punches', function (Blueprint $table) {
            $table->id();
            $table->integer('EmployeeId');
            $table->integer('MachineId')->nullable();
            $table->dateTime('PunchTime');
            $table->string('Ip')->nullable();
            $table->string('GroupName')->nullable();
            $table->string('EmployeeName')->nullable();
            $table->boolean('Islive')->default(false);

            $table->unique(['EmployeeId', 'PunchTime'], 'uq_employee_punch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('punches');
    }
};
