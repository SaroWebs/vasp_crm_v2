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
        Schema::table('clients', function (Blueprint $table) {
            $table->boolean('sso_enabled')->default(false)->after('status');
            $table->text('sso_secret')->nullable()->after('sso_enabled');

            $table->unique('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique(['code']);

            $table->dropColumn('sso_secret');
            $table->dropColumn('sso_enabled');
        });
    }
};
