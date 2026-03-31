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
        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('notify_via_pusher')->default(true)->comment('In-app real-time notifications');
            $table->boolean('notify_via_whatsapp')->default(false)->comment('Send via WhatsApp');
            $table->boolean('notify_via_sms')->default(false)->comment('Send via SMS');
            $table->boolean('notify_via_email')->default(true)->comment('Send via email');
            $table->string('whatsapp_number')->nullable()->comment('WhatsApp phone number for notifications');
            $table->string('sms_number')->nullable()->comment('SMS phone number for notifications');
            $table->timestamps();

            // Unique constraint - one preference record per user
            $table->unique(['user_id']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
    }
};
