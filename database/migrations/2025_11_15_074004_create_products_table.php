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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // EDNECT, TRANSTRACT, DESALITE
            $table->text('description')->nullable();
            $table->string('version')->nullable();
            $table->enum('status', ['active', 'inactive', 'discontinued'])->default('active');
            $table->json('metadata')->nullable(); // For additional product configuration
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};