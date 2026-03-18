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
        Schema::create('workload_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('metric_type');
            $table->decimal('metric_value', 10, 2);
            $table->string('metric_unit')->nullable();
            $table->timestamp('period_start');
            $table->timestamp('period_end');
            $table->timestamp('calculated_at');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['user_id', 'metric_type', 'period_start', 'period_end'], 'workload_metrics_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workload_metrics');
    }
};
