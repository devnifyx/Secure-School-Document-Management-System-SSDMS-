<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\Panitia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = $this->makeAdmin();
    }

    public function test_log_audit_records_actor_entity_ip_and_user_agent(): void
    {
        Sanctum::actingAs($this->admin);

        logAudit('TEST_ACTION', 'Document', 1, 'Details');

        $log = AuditLog::where('action', 'TEST_ACTION')->firstOrFail();
        $this->assertSame($this->admin->id, $log->user_id);
        $this->assertSame('Document', $log->entity_type);
        $this->assertSame(1, $log->entity_id);
        $this->assertSame('Details', $log->details);
        $this->assertNotEmpty($log->ip_address);
        $this->assertNotNull($log->created_at);
    }

    public function test_audit_log_can_be_filtered_by_action_and_is_admin_only(): void
    {
        logAudit('ALPHA_EVENT');
        logAudit('BETA_EVENT');

        $this->actingAsUser($this->admin)->getJson('/api/audit-logs?action=ALPHA_EVENT')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.action', 'ALPHA_EVENT');

        $panitia = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$panitia]);
        $this->actingAsUser($teacher, $panitia)->getJson('/api/audit-logs')->assertStatus(403);
    }

    public function test_audit_log_exports_as_csv_and_neutralises_spreadsheet_formulas(): void
    {
        logAudit('LOGIN_FAILED', null, null, '=HYPERLINK("http://evil.example","click")');
        logAudit('DOCUMENT_UPLOADED', 'Document', 7, 'Plain, with comma');

        $response = $this->actingAsUser($this->admin)->get('/api/audit-logs/export');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="audit-logs-', $response->headers->get('Content-Disposition'));

        $csv = $response->getContent();
        $this->assertStringStartsWith('ID,User,Action,"Entity Type","Entity ID",Details,"IP Address",Timestamp', $csv);
        $this->assertStringContainsString('DOCUMENT_UPLOADED', $csv);
        $this->assertStringContainsString('"Plain, with comma"', $csv);
        $this->assertStringContainsString("\"'=HYPERLINK", $csv);
        $this->assertStringNotContainsString(',"=HYPERLINK', $csv);
        $this->assertDatabaseHas('audit_logs', ['action' => 'AUDIT_LOG_EXPORTED', 'user_id' => $this->admin->id]);
    }

    public function test_export_respects_the_action_filter(): void
    {
        logAudit('ALPHA_EVENT');
        logAudit('BETA_EVENT');

        $csv = $this->actingAsUser($this->admin)->get('/api/audit-logs/export?action=ALPHA_EVENT')->getContent();

        $this->assertStringContainsString('ALPHA_EVENT', $csv);
        $this->assertStringNotContainsString('BETA_EVENT', $csv);
    }

    public function test_no_route_can_edit_or_delete_audit_records(): void
    {
        $methods = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($r) => str_contains($r->uri(), 'audit-logs'))
            ->flatMap(fn ($r) => $r->methods())
            ->reject(fn ($m) => $m === 'HEAD')
            ->unique()->values()->all();

        $this->assertSame(['GET'], $methods);
    }

    public function test_assigning_a_primary_panitia_replaces_the_previous_primary(): void
    {
        $science = $this->makePanitia('Science');
        $maths = $this->makePanitia('Mathematics');
        $teacher = $this->makeTeacher([$science]);

        $this->actingAsUser($this->admin)->postJson("/api/panitia/{$maths->id}/assign", [
            'user_id' => $teacher->id,
            'is_primary' => true,
        ])->assertOk();

        $primary = $teacher->panitia()->wherePivot('is_primary', true)->pluck('panitia.id')->all();
        $this->assertSame([$maths->id], $primary);

        $this->postJson('/api/login', ['login' => $teacher->email, 'password' => 'secret1234'])
            ->assertOk()->assertJsonCount(2, 'panitia_list')->assertJsonPath('needs_panitia_selection', true);
    }

    public function test_removing_the_primary_panitia_promotes_another_one(): void
    {
        $science = $this->makePanitia('Science');
        $maths = $this->makePanitia('Mathematics');
        $teacher = $this->makeTeacher([$science, $maths]);

        $this->actingAsUser($this->admin)->deleteJson("/api/panitia/{$science->id}/members/{$teacher->id}")->assertOk();

        $this->assertSame([$maths->id], $teacher->panitia()->wherePivot('is_primary', true)->pluck('panitia.id')->all());
    }

    public function test_same_teacher_cannot_be_assigned_twice(): void
    {
        $science = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$science]);

        $this->actingAsUser($this->admin)
            ->postJson("/api/panitia/{$science->id}/assign", ['user_id' => $teacher->id])->assertStatus(422);
    }

    public function test_deleting_a_user_keeps_audit_history_and_removes_their_notifications_and_tokens(): void
    {
        $teacher = $this->makeTeacher();
        $teacher->createToken('session');
        Notification::create(['user_id' => $teacher->id, 'message' => 'hello']);
        logAudit('LOGIN_SUCCESS', 'User', $teacher->id, null, $teacher->id);

        $this->actingAsUser($this->admin)->deleteJson("/api/users/{$teacher->id}")->assertNoContent();

        $this->assertNull(User::find($teacher->id));
        $this->assertSame(0, Notification::where('user_id', $teacher->id)->count());
        $this->assertSame(0, $teacher->tokens()->count());
        $this->assertTrue(AuditLog::where('action', 'LOGIN_SUCCESS')->whereNull('user_id')->exists());
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_DELETED', 'entity_id' => $teacher->id]);
    }

    public function test_user_who_owns_documents_cannot_be_deleted(): void
    {
        $panitia = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$panitia]);
        Document::create([
            'title' => 'Paper', 'file_path' => 'documents/x', 'file_name' => 'x.pdf', 'file_type' => 'application/pdf',
            'category' => 'Other', 'uploaded_by' => $teacher->id, 'panitia_id' => $panitia->id, 'encrypted_key' => 'k',
        ]);

        $this->actingAsUser($this->admin)->deleteJson("/api/users/{$teacher->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, '1 document(s)') && str_contains($m, 'Deactivate'));

        $this->assertNotNull(User::find($teacher->id));
    }

    public function test_administrators_cannot_delete_themselves(): void
    {
        $this->actingAsUser($this->admin)->deleteJson("/api/users/{$this->admin->id}")
            ->assertStatus(422)->assertJsonPath('message', 'You cannot delete your own account.');
    }

    public function test_registration_rejects_duplicates_and_inactive_panitia(): void
    {
        $active = $this->makePanitia('Science');
        $inactive = $this->makePanitia('History', 'inactive');
        $this->makeTeacher([], ['email' => 'taken@test.local', 'username' => 'taken_name']);

        $base = ['name' => 'X', 'password' => 'password123', 'password_confirmation' => 'password123', 'primary_panitia_id' => $active->id];

        $this->postJson('/api/register', $base + ['email' => 'taken@test.local', 'username' => 'fresh_name'])
            ->assertStatus(422)->assertJsonValidationErrors('email');
        $this->postJson('/api/register', $base + ['email' => 'fresh@test.local', 'username' => 'taken_name'])
            ->assertStatus(422)->assertJsonValidationErrors('username');
        $this->postJson('/api/register', array_merge($base, ['email' => 'fresh@test.local', 'username' => 'fresh_name', 'primary_panitia_id' => $inactive->id]))
            ->assertStatus(404);
    }

    public function test_changing_password_requires_the_current_password(): void
    {
        $this->actingAsUser($this->admin);

        $this->putJson('/api/profile', [
            'current_password' => 'wrong-one',
            'new_password' => 'new-secret-123',
            'new_password_confirmation' => 'new-secret-123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->putJson('/api/profile', [
            'current_password' => 'secret1234',
            'new_password' => 'new-secret-123',
            'new_password_confirmation' => 'new-secret-123',
        ])->assertOk();

        $this->postJson('/api/login', ['login' => 'admin@test.local', 'password' => 'new-secret-123'])->assertOk();
    }
}
