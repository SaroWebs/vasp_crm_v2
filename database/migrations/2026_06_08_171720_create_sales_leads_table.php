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
        Schema::create('sales_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('organization_name');
            $table->enum('organization_type', ['school', 'college', 'business', 'logistics_company', 'other'])->default('other');
            $table->string('contact_person_name')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('location')->nullable();
            $table->text('service_notes')->nullable();
            $table->enum('interest_level', ['negative', 'unclear', 'positive'])->default('unclear');
            $table->enum('status', ['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost'])->default('new');
            $table->string('source')->nullable();
            $table->text('latest_response')->nullable();
            $table->dateTime('last_contacted_at')->nullable();
            $table->dateTime('next_follow_up_at')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['owner_user_id', 'status']);
            $table->index(['interest_level', 'status']);
            $table->index('next_follow_up_at');
            $table->index('organization_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_leads');
    }
};
