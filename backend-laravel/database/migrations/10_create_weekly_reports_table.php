<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submitted_by')->constrained('users');
            $table->foreignId('panitia_id')->nullable()->constrained('panitia')->nullOnDelete();
            $table->string('title');
            $table->unsignedInteger('week_number');
            $table->date('period_start');
            $table->date('period_end');
            $table->text('activity_summary');
            $table->text('challenges')->nullable();
            $table->text('actions_taken')->nullable();
            $table->text('next_week_plan')->nullable();
            $table->enum('status', ['Pending Review', 'Approved', 'Rejected'])->default('Pending Review');
            $table->boolean('is_late')->default(false);
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_reports');
    }
};
