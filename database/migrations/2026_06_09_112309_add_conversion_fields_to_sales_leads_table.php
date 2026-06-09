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
        Schema::table('sales_leads', function (Blueprint $table) {
            $table->foreignId('converted_client_id')
                ->nullable()
                ->after('updated_by_user_id')
                ->constrained('clients')
                ->nullOnDelete();
            $table->timestamp('converted_at')->nullable()->after('converted_client_id');

            $table->index('converted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_leads', function (Blueprint $table) {
            $table->dropForeign(['converted_client_id']);
            $table->dropIndex(['converted_at']);
            $table->dropColumn(['converted_client_id', 'converted_at']);
        });
    }
};
