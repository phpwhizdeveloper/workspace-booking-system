<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\BookingController;

Route::get('/workspaces', [WorkspaceController::class, 'index']);
Route::post('/workspaces/store', [WorkspaceController::class, 'store']);


// Booking routes for React app
Route::get('/bookings', [BookingController::class, 'index']);
Route::post('/bookings/store', [BookingController::class, 'store']);
Route::get('/bookings/{booking}', [BookingController::class, 'show']);
Route::post('/bookings/status/{booking}', [BookingController::class, 'statusUpdate']);
Route::put('/bookings/{booking}', [BookingController::class, 'update']);
Route::patch('/bookings/{booking}', [BookingController::class, 'update']);
Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);
Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);


