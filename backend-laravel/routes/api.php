<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public routes
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
Route::post('/register', [\App\Http\Controllers\RegistrationController::class, 'register']);
Route::get('/panitia/public', [\App\Http\Controllers\RegistrationController::class, 'publicPanitiaList']);

// Forgot password (email verification)
Route::post('/forgot-password', [\App\Http\Controllers\PasswordResetController::class, 'forgotPassword'])->middleware('throttle:password-reset-request');
Route::post('/verify-reset-code', [\App\Http\Controllers\PasswordResetController::class, 'verifyCode']);
Route::post('/reset-password', [\App\Http\Controllers\PasswordResetController::class, 'resetPassword']);

Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Panitia selection (post-login)
    Route::post('auth/select-panitia', [\App\Http\Controllers\AuthController::class, 'selectPanitia']);
    Route::post('auth/switch-panitia', [\App\Http\Controllers\AuthController::class, 'switchPanitia']);
    Route::get('auth/my-panitia', [\App\Http\Controllers\AuthController::class, 'myPanitia']);

    // User management (Admin only)
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\UserController::class);
        Route::post('users/{user}/approve', [\App\Http\Controllers\UserController::class, 'approve']);
        Route::post('users/{user}/reject', [\App\Http\Controllers\UserController::class, 'reject']);
        Route::get('registrations/pending', [\App\Http\Controllers\UserController::class, 'pendingRegistrations']);

        // Panitia management
        Route::apiResource('panitia', \App\Http\Controllers\PanitiaController::class);
        Route::get('panitia/{panitia}/members', [\App\Http\Controllers\PanitiaController::class, 'members']);
        Route::post('panitia/{panitia}/assign', [\App\Http\Controllers\PanitiaController::class, 'assignUser']);
        Route::delete('panitia/{panitia}/members/{user}', [\App\Http\Controllers\PanitiaController::class, 'removeUser']);
        Route::put('panitia/{panitia}/members/{user}/primary', [\App\Http\Controllers\PanitiaController::class, 'setPrimary']);

        // Weekly report late-submission toggle (write access)
        Route::put('settings/late-submission', [\App\Http\Controllers\WeeklyReportController::class, 'updateLateSubmissionSetting']);
    });

    // Any authenticated user needs to know whether late submission is currently allowed
    Route::get('settings/late-submission', [\App\Http\Controllers\WeeklyReportController::class, 'getLateSubmissionSetting']);

    // Documents (with Panitia access control)
    Route::middleware('panitia.access')->group(function () {
        Route::apiResource('documents', \App\Http\Controllers\DocumentController::class);
        Route::get('documents/{document}/download', [\App\Http\Controllers\DocumentController::class, 'download']);
        Route::get('documents/{document}/preview', [\App\Http\Controllers\DocumentController::class, 'preview']);
        Route::post('documents/{document}/approve', [\App\Http\Controllers\DocumentController::class, 'approve'])->middleware('role:Admin');
        Route::post('documents/{document}/reject', [\App\Http\Controllers\DocumentController::class, 'reject'])->middleware('role:Admin');
        Route::post('documents/{document}/verify', [\App\Http\Controllers\DocumentController::class, 'verify'])->middleware('role:Admin');

        // Weekly reports (with Panitia access control)
        Route::apiResource('weekly-reports', \App\Http\Controllers\WeeklyReportController::class);
        Route::get('weekly-reports/{weeklyReport}/attachments/{attachment}/download', [\App\Http\Controllers\WeeklyReportController::class, 'downloadAttachment']);
        Route::get('weekly-reports/{weeklyReport}/attachments/{attachment}/preview', [\App\Http\Controllers\WeeklyReportController::class, 'previewAttachment']);
        Route::post('weekly-reports/{weeklyReport}/approve', [\App\Http\Controllers\WeeklyReportController::class, 'approve'])->middleware('role:Admin');
        Route::post('weekly-reports/{weeklyReport}/reject', [\App\Http\Controllers\WeeklyReportController::class, 'reject'])->middleware('role:Admin');
        Route::get('weekly-reports-not-submitted', [\App\Http\Controllers\WeeklyReportController::class, 'notSubmitted'])->middleware('role:Admin');

        // Dashboard stats
        Route::get('dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);
    });

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
