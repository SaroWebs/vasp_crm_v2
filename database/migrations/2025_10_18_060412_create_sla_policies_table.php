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
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('task_type_id')->nullable()->constrained('task_types')->nullOnDelete();
            $table->string('priority'); // Priority level
            $table->integer('response_time_minutes'); // Time to start work
            $table->integer('resolution_time_minutes'); // Time to complete
            $table->integer('review_time_minutes'); // Time to approve in review
            $table->json('escalation_steps')->nullable(); // Escalation configuration
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sla_policies');
    }
};
