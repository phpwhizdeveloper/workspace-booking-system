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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id(); // BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // BIGINT UNSIGNED and foreign key
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade'); // BIGINT UNSIGNED and foreign key
            $table->dateTime('start_time'); // DATETIME
            $table->dateTime('end_time');   // DATETIME
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending'); // ENUM with default
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
