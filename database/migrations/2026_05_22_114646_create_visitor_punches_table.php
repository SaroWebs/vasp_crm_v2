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
        Schema::create('visitor_punches', function (Blueprint $table) {
            $table->id();
            $table->integer('visitor_code');
            $table->integer('machine_id')->nullable();
            $table->dateTime('punch_time');
            $table->string('ip')->nullable();
            $table->boolean('is_live')->default(false);
            $table->timestamps();
            $table->unique(['visitor_code', 'punch_time']);
            $table->foreign('visitor_code')->references('code')->on('visitors')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitor_punches');
    }
};
