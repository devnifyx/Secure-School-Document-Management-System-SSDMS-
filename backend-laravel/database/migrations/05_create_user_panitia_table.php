<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_panitia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('panitia_id')->constrained('panitia')->onDelete('cascade');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'panitia_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_panitia');
    }
};
