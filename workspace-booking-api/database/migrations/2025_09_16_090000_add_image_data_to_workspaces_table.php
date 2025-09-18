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
        Schema::table('workspaces', function (Blueprint $table) {
            // Store image as base64 text and keep metadata for easier serving
            $table->longText('image_data')->nullable()->after('image');
            $table->string('image_mime', 191)->nullable()->after('image_data');
            $table->unsignedBigInteger('image_size')->nullable()->after('image_mime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['image_data', 'image_mime', 'image_size']);
        });
    }
};


