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
        Schema::create('sales_lead_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_lead_id')->constrained('sales_leads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->enum('activity_type', ['call', 'visit', 'meeting', 'whatsapp', 'email', 'note']);
            $table->enum('outcome_status', ['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost'])->nullable();
            $table->text('response_text')->nullable();
            $table->dateTime('activity_at');
            $table->dateTime('next_follow_up_at')->nullable();
            $table->timestamps();

            $table->index(['sales_lead_id', 'activity_at']);
            $table->index(['user_id', 'activity_at']);
            $table->index('next_follow_up_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_lead_activities');
    }
};
