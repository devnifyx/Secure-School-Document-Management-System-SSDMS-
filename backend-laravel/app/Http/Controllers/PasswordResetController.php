<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    private const GENERIC_SENT_MESSAGE = 'If that email exists in our system, a verification code has been sent.';

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            PasswordResetCode::where('user_id', $user->id)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);

            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            PasswordResetCode::create([
                'user_id' => $user->id,
                'code' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
            ]);

            Mail::to($user->email)->send(new PasswordResetCodeMail($code));

            logAudit('PASSWORD_RESET_REQUESTED', 'User', $user->id, null, $user->id);
            logAudit('PASSWORD_RESET_CODE_GENERATED', 'User', $user->id, null, $user->id);
        }

        return response()->json(['message' => self::GENERIC_SENT_MESSAGE]);
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 422);
        }

        $record = PasswordResetCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 422);
        }

        if ($record->expires_at->isPast()) {
            logAudit('PASSWORD_RESET_CODE_EXPIRED', 'User', $user->id, null, $user->id);
            return response()->json(['message' => 'Verification code has expired. Please request a new one.'], 422);
        }

        if ($record->attempts >= 5) {
            return response()->json(['message' => 'Too many failed attempts. Please request a new code.'], 422);
        }

        if (!Hash::check($request->code, $record->code)) {
            $record->increment('attempts');
            logAudit('PASSWORD_RESET_CODE_FAILED_ATTEMPT', 'User', $user->id, "Attempt {$record->attempts}", $user->id);
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        $token = Str::random(64);
        $record->update(['verified_token' => $token]);

        logAudit('PASSWORD_RESET_CODE_VERIFIED', 'User', $user->id, null, $user->id);

        return response()->json(['reset_token' => $token]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = PasswordResetCode::where('verified_token', $request->reset_token)
            ->whereNull('used_at')
            ->first();

        if (!$record || $record->expires_at->isPast()) {
            return response()->json(['message' => 'Invalid or expired reset session. Please start again.'], 422);
        }

        $user = $record->user;
        $user->update(['password' => Hash::make($request->password)]);
        $record->update(['used_at' => now()]);
        $user->tokens()->delete();

        logAudit('PASSWORD_RESET_SUCCESS', 'User', $user->id, null, $user->id);

        return response()->json(['message' => 'Password has been reset successfully. Please log in with your new password.']);
    }
}
