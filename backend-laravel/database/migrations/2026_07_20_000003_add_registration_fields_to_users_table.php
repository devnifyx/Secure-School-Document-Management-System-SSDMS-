<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->unique()->after('name');
            $table->enum('account_status', ['Pending', 'Approved', 'Rejected'])->default('Pending')->after('locked_until');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('account_status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        DB::table('users')->update([
            'account_status' => 'Approved',
            'username' => DB::raw('email'),
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['username', 'account_status', 'approved_by', 'approved_at']);
        });
    }
};
