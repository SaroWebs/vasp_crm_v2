<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_cycle_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('month_starts_on')->comment('Day of month (1-31) when each new cycle begins');
            $table->date('effective_from')->comment('Date from which this rule is in effect, inclusive');
            $table->date('effective_to')->nullable()->comment('Date until which this rule is in effect, inclusive. null = still active');
            $table->boolean('include_gap_in_current')->default(true)->comment('If true, absorb gap days between rules into first cycle of this rule');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_cycle_rules');
    }
};
