<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    Route::get('/auth/me', fn (Request $request) => ['user' => $request->user()])
        ->middleware('auth:sanctum');
});
