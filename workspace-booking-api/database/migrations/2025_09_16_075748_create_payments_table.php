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
        Schema::create('payments', function (Blueprint $table) {
            $table->id(); // BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
            $table->unsignedBigInteger('booking_id'); // BIGINT UNSIGNED
            $table->decimal('amount', 10, 2); // DECIMAL(10, 2)
            $table->string('payment_method', 50); // VARCHAR(50)
            $table->enum('payment_status', ['pending', 'completed', 'failed'])->default('pending'); // ENUM
            $table->timestamps(); // created_at and updated_at with default CURRENT_TIMESTAMP behaviour

            // Foreign key constraint
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
