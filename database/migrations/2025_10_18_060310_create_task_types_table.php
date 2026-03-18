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
        Schema::create('task_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Bugfix, ProjectWork, Support, etc.
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('default_priority')->default('medium');
            $table->boolean('requires_sla')->default(true);
            $table->boolean('requires_project')->default(false);
            $table->boolean('requires_department')->default(false);
            $table->json('workflow_definition')->nullable(); // State machine definition
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_types');
    }
};
