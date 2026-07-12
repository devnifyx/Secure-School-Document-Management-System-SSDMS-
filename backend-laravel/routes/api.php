<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Authentication routes
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User management (Admin only)
    Route::apiResource('users', \App\Http\Controllers\UserController::class)->middleware('role:Admin');
    
    // Documents
    Route::apiResource('documents', \App\Http\Controllers\DocumentController::class);
    Route::get('documents/{document}/download', [\App\Http\Controllers\DocumentController::class, 'download']);
    Route::post('documents/{document}/approve', [\App\Http\Controllers\DocumentController::class, 'approve'])->middleware('role:Admin');
    Route::post('documents/{document}/reject', [\App\Http\Controllers\DocumentController::class, 'reject'])->middleware('role:Admin');
    Route::post('documents/{document}/verify', [\App\Http\Controllers\DocumentController::class, 'verify'])->middleware('role:Admin');
    
    // Dashboard stats
    Route::get('dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);

    // Profile
    Route::get('profile', [\App\Http\Controllers\ProfileController::class, 'show']);
    Route::put('profile', [\App\Http\Controllers\ProfileController::class, 'update']);

    // Audit logs (Admin only)
    Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->middleware('role:Admin');
    Route::get('audit-logs/export', [\App\Http\Controllers\AuditLogController::class, 'export'])->middleware('role:Admin');
    
    // Notifications
    Route::get('notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::put('notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
});
