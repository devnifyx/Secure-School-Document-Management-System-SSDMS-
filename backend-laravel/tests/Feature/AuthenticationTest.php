<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    public function test_login_without_password_returns_validation_error(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/login', ['login' => 'admin@test.local'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_login_works_with_email_or_username(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/login', ['login' => 'admin@test.local', 'password' => 'secret1234'])
            ->assertOk()->assertJsonStructure(['token', 'user']);

        $this->postJson('/api/login', ['login' => 'admin', 'password' => 'secret1234'])
            ->assertOk();
    }

    public function test_pending_account_cannot_log_in(): void
    {
        $this->makeTeacher([], ['account_status' => 'Pending', 'email' => 'pending@test.local']);

        $this->postJson('/api/login', ['login' => 'pending@test.local', 'password' => 'secret1234'])
            ->assertStatus(422)
            ->assertJsonPath('errors.login.0', 'Your account is pending administrator approval.');
    }

    public function test_rejected_account_cannot_log_in(): void
    {
        $this->makeTeacher([], ['account_status' => 'Rejected', 'email' => 'rejected@test.local']);

        $this->postJson('/api/login', ['login' => 'rejected@test.local', 'password' => 'secret1234'])
            ->assertStatus(422)
            ->assertJsonPath('errors.login.0', 'Your registration has been rejected.');
    }

    public function test_teacher_is_locked_for_15_minutes_after_three_failed_attempts(): void
    {
        $teacher = $this->makeTeacher();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'wrong-password'])
                ->assertStatus(422);
        }

        $teacher->refresh();
        $this->assertSame(3, $teacher->failed_attempts);
        $this->assertTrue($teacher->locked_until->isFuture());
        $this->assertEqualsWithDelta(15, now()->diffInMinutes($teacher->locked_until, true), 1);

        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'secret1234'])
            ->assertStatus(422)
            ->assertJsonPath('errors.login.0', fn ($m) => str_contains($m, 'locked'));
    }

    public function test_administrator_accounts_are_never_locked(): void
    {
        $admin = $this->makeAdmin();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['login' => $admin->email, 'password' => 'wrong-password']);
        }

        $this->assertNull($admin->fresh()->locked_until);
        $this->postJson('/api/login', ['login' => $admin->email, 'password' => 'secret1234'])->assertOk();
    }

    public function test_successful_login_resets_failed_attempts_and_is_audited(): void
    {
        $teacher = $this->makeTeacher();
        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'wrong']);
        $this->assertSame(1, $teacher->fresh()->failed_attempts);

        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'secret1234'])->assertOk();

        $this->assertSame(0, $teacher->fresh()->failed_attempts);
        $this->assertDatabaseHas('audit_logs', ['action' => 'LOGIN_FAILED', 'user_id' => $teacher->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'LOGIN_SUCCESS', 'user_id' => $teacher->id]);
    }

    public function test_protected_endpoints_reject_requests_without_a_token(): void
    {
        $this->getJson('/api/documents')->assertStatus(401)->assertJsonPath('message', 'Unauthenticated.');
        $this->getJson('/api/profile')->assertStatus(401)->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_teacher_cannot_reach_admin_only_endpoints(): void
    {
        $panitia = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$panitia]);

        $this->actingAsUser($teacher, $panitia);

        foreach (['/api/users', '/api/panitia', '/api/audit-logs'] as $url) {
            $this->getJson($url)->assertStatus(403)->assertJsonPath('message', 'Unauthorized');
        }
    }

    public function test_teacher_with_one_panitia_is_selected_automatically(): void
    {
        $science = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$science]);

        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'secret1234'])
            ->assertOk()
            ->assertJsonPath('needs_panitia_selection', false)
            ->assertJsonPath('active_panitia.id', $science->id);
    }

    public function test_teacher_with_several_panitia_must_choose_one(): void
    {
        $teacher = $this->makeTeacher([$this->makePanitia('Science'), $this->makePanitia('Mathematics')]);

        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'secret1234'])
            ->assertOk()
            ->assertJsonPath('needs_panitia_selection', true)
            ->assertJsonPath('active_panitia', null)
            ->assertJsonCount(2, 'panitia_list');
    }

    public function test_registration_approval_and_first_login_flow(): void
    {
        $panitia = $this->makePanitia('ICT');
        $admin = $this->makeAdmin();

        $this->postJson('/api/register', [
            'name' => 'New Teacher',
            'email' => 'new@test.local',
            'username' => 'new_teacher',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'primary_panitia_id' => $panitia->id,
        ])->assertCreated();

        $user = User::where('email', 'new@test.local')->firstOrFail();
        $this->assertSame('Pending', $user->account_status);
        $this->assertTrue($user->panitia->first()->pivot->is_primary == 1);
        $this->assertTrue(Notification::where('user_id', $admin->id)->where('message', 'like', '%New Teacher%')->exists());

        $this->postJson('/api/login', ['login' => 'new@test.local', 'password' => 'password123'])->assertStatus(422);

        $this->actingAsUser($admin)->postJson("/api/users/{$user->id}/approve")->assertOk();

        $this->assertSame('Approved', $user->fresh()->account_status);
        $this->assertTrue(Notification::where('user_id', $user->id)->exists());
        $this->assertTrue(AuditLog::where('action', 'REGISTRATION_SUBMITTED')->exists());
    }
}
