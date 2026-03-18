<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_comment_attachments', function (Blueprint $table) {
            $table->id();
            $table->morphs('comment');
            $table->string('file_path');
            $table->string('file_url')->nullable();
            $table->string('file_type')->nullable();
            $table->string('original_filename')->nullable();
            $table->integer('file_size')->nullable();
            $table->enum('uploaded_by_type', ['user', 'organization_user'])->default('user');
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_comment_attachments');
    }
};
