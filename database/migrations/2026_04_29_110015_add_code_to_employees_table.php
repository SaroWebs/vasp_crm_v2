<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * NOTE: The 'code' column already exists in the 'employees' table
     * (defined in 2025_11_26_103443_create_employees_table.php).
     * This migration is kept as a placeholder to avoid breaking the user's workflow.
     */
    public function up(): void
    {
        // The 'code' column already exists in the base migration.
        /*
        Schema::table('employees', function (Blueprint $table) {
            $table->string('code')->nullable()->after('email');
        });
        */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /*
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('code');
        });
        */
    }
};
