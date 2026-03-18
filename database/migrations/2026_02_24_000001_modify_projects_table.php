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
        Schema::table('projects', function (Blueprint $table) {
            // Drop existing foreign key on department_id
            $table->dropForeign(['department_id']);

            // Make department_id nullable (projects can exist without department)
            $table->unsignedBigInteger('department_id')->nullable()->change();

            // Re-add foreign key with nullOnDelete
            $table->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->nullOnDelete();

            // Add new fields
            $table->string('code')->unique()->nullable()->after('name');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])
                ->default('medium')
                ->after('status');
            $table->decimal('budget', 15, 2)->nullable()->after('end_date');
            $table->integer('progress')->default(0)->after('budget');
            $table->string('color')->nullable()->after('progress');
            $table->json('settings')->nullable()->after('color');
            $table->foreignId('created_by')
                ->nullable()
                ->after('settings')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Drop new foreign key
            $table->dropForeign(['created_by']);

            // Drop new columns
            $table->dropColumn([
                'code',
                'priority',
                'budget',
                'progress',
                'color',
                'settings',
                'created_by',
            ]);

            // Drop the nullable foreign key
            $table->dropForeign(['department_id']);

            // Restore original department_id constraint (required, cascade on delete)
            $table->unsignedBigInteger('department_id')->nullable(false)->change();
            $table->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->onDelete('cascade');
        });
    }
};
