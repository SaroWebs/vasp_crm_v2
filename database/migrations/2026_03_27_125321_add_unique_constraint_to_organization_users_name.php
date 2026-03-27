<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_users', function (Blueprint $table) {
            $table->unique(['client_id', 'name'], 'organization_users_client_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('organization_users', function (Blueprint $table) {
            $table->dropUnique('organization_users_client_name_unique');
        });
    }
};
