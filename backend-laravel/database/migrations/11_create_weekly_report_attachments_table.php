<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_report_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_report_id')->constrained('weekly_reports')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->text('encrypted_key');
            $table->string('file_hash');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_report_attachments');
    }
};
