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
        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('delivery_channel', ['pusher', 'whatsapp', 'sms', 'email', 'database'])
                ->default('database')
                ->after('read_at')
                ->comment('The channel used to deliver this notification');
            $table->boolean('delivered')->default(false)->after('delivery_channel')->comment('Whether notification was delivered via external channel');
            $table->timestamp('delivered_at')->nullable()->after('delivered')->comment('When notification was delivered via external channel');
            $table->text('delivery_response')->nullable()->after('delivered_at')->comment('Response from external delivery API');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_channel',
                'delivered',
                'delivered_at',
                'delivery_response',
            ]);
        });
    }
};