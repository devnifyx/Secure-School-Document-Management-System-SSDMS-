<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->teacher = $this->makeTeacher([], ['email' => 'cikgu@test.local']);
    }

    private function requestCode(string $email = 'cikgu@test.local'): string
    {
        $this->postJson('/api/forgot-password', ['email' => $email])->assertOk();

        $code = null;
        Mail::assertSent(PasswordResetCodeMail::class, function ($mail) use (&$code) {
            $code = $mail->code;
            return true;
        });

        return $code;
    }

    public function test_unknown_email_gets_the_same_response_and_no_email(): void
    {
        $known = $this->postJson('/api/forgot-password', ['email' => 'cikgu@test.local'])->json('message');
        Mail::fake();
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'nobody@test.local'])->assertOk()->json('message');

        $this->assertSame($known, $unknown);
        Mail::assertNothingSent();
        $this->assertSame(1, PasswordResetCode::count());
    }

    public function test_code_is_six_digits_hashed_and_expires_in_ten_minutes(): void
    {
        $code = $this->requestCode();
        $row = PasswordResetCode::firstOrFail();

        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
        $this->assertNotSame($code, $row->code);
        $this->assertTrue(Hash::check($code, $row->code));
        $this->assertEqualsWithDelta(10, now()->diffInMinutes($row->expires_at, true), 1);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_RESET_REQUESTED', 'user_id' => $this->teacher->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_RESET_CODE_GENERATED', 'user_id' => $this->teacher->id]);
    }

    public function test_full_reset_flow_changes_the_password_and_signs_every_session_out(): void
    {
        $oldToken = $this->teacher->createToken('existing-session')->plainTextToken;
        $code = $this->requestCode();

        $token = $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $code])
            ->assertOk()->json('reset_token');
        $this->assertNotEmpty($token);

        $this->postJson('/api/reset-password', [
            'reset_token' => $token,
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertOk();

        $this->assertTrue(Hash::check('brand-new-pass', $this->teacher->fresh()->password));
        $this->assertSame(0, $this->teacher->tokens()->count());
        $this->assertNotNull(PasswordResetCode::first()->used_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_RESET_CODE_VERIFIED']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_RESET_SUCCESS', 'user_id' => $this->teacher->id]);

        $this->postJson('/api/login', ['login' => 'cikgu@test.local', 'password' => 'brand-new-pass'])->assertOk();
        $this->postJson('/api/login', ['login' => 'cikgu@test.local', 'password' => 'secret1234'])->assertStatus(422);
    }

    public function test_a_reset_token_can_only_be_used_once(): void
    {
        $code = $this->requestCode();
        $token = $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $code])->json('reset_token');
        $body = ['reset_token' => $token, 'password' => 'first-new-pass', 'password_confirmation' => 'first-new-pass'];

        $this->postJson('/api/reset-password', $body)->assertOk();
        $this->postJson('/api/reset-password', array_merge($body, ['password' => 'second-new-pass', 'password_confirmation' => 'second-new-pass']))
            ->assertStatus(422);
    }

    public function test_reset_password_needs_a_confirmed_password_of_eight_characters(): void
    {
        $code = $this->requestCode();
        $token = $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $code])->json('reset_token');

        $this->postJson('/api/reset-password', ['reset_token' => $token, 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson('/api/reset-password', ['reset_token' => $token, 'password' => 'long-enough-1', 'password_confirmation' => 'different-1'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_code_is_blocked_after_five_wrong_attempts(): void
    {
        $code = $this->requestCode();
        $wrong = $code === '000000' ? '111111' : '000000';

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $wrong])
                ->assertStatus(422)->assertJsonPath('message', 'Invalid verification code.');
        }

        $this->assertSame(5, PasswordResetCode::first()->attempts);
        $this->assertSame(5, \App\Models\AuditLog::where('action', 'PASSWORD_RESET_CODE_FAILED_ATTEMPT')->count());

        $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Too many failed attempts. Please request a new code.');
    }

    public function test_code_expires_after_ten_minutes(): void
    {
        $code = $this->requestCode();

        $this->travel(11)->minutes();

        $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Verification code has expired. Please request a new one.');
        $this->assertDatabaseHas('audit_logs', ['action' => 'PASSWORD_RESET_CODE_EXPIRED', 'user_id' => $this->teacher->id]);
    }

    public function test_requesting_a_new_code_invalidates_the_previous_one(): void
    {
        $first = $this->requestCode();
        Mail::fake();
        $second = $this->requestCode();

        if ($first === $second) {
            $this->markTestSkipped('The two random codes happened to be identical.');
        }

        $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $first])->assertStatus(422);
        $this->postJson('/api/verify-reset-code', ['email' => 'cikgu@test.local', 'code' => $second])->assertOk();
    }

    public function test_only_three_codes_can_be_requested_per_hour(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/forgot-password', ['email' => 'cikgu@test.local'])->assertOk();
        }

        $this->postJson('/api/forgot-password', ['email' => 'cikgu@test.local'])->assertStatus(429);
    }

    public function test_verifying_for_an_unknown_email_reveals_nothing(): void
    {
        $this->postJson('/api/verify-reset-code', ['email' => 'nobody@test.local', 'code' => '123456'])
            ->assertStatus(422)->assertJsonPath('message', 'Invalid or expired verification code.');
    }
}
