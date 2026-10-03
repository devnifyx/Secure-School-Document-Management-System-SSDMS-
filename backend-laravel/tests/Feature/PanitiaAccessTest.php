<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class PanitiaAccessTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    public function test_teacher_is_refused_a_panitia_they_are_not_assigned_to(): void
    {
        $science = $this->makePanitia('Science');
        $maths = $this->makePanitia('Mathematics');
        $teacher = $this->makeTeacher([$science]);

        $this->actingAsUser($teacher, $maths)->getJson('/api/documents')
            ->assertStatus(403)
            ->assertJsonPath('message', 'You do not have access to this Panitia.');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UNAUTHORIZED_PANITIA_ACCESS',
            'user_id' => $teacher->id,
            'entity_id' => $maths->id,
        ]);
    }

    public function test_teacher_must_send_an_active_panitia(): void
    {
        $teacher = $this->makeTeacher([$this->makePanitia('Science')]);

        $this->actingAsUser($teacher)->getJson('/api/documents')
            ->assertStatus(403)
            ->assertJsonPath('message', 'No active Panitia selected.');
    }

    public function test_deactivated_panitia_cannot_be_used(): void
    {
        $inactive = $this->makePanitia('History', 'inactive');
        $teacher = $this->makeTeacher([$inactive]);

        $this->actingAsUser($teacher, $inactive)->getJson('/api/documents')->assertStatus(403);
    }

    public function test_assigned_teacher_is_let_through(): void
    {
        $science = $this->makePanitia('Science');
        $teacher = $this->makeTeacher([$science]);

        $this->actingAsUser($teacher, $science)->getJson('/api/documents')->assertOk();
    }

    public function test_administrator_passes_without_any_panitia_assignment(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAsUser($admin)->getJson('/api/documents')->assertOk();
        $this->actingAsUser($admin, $this->makePanitia('ICT'))->getJson('/api/documents')->assertOk();
    }

    public function test_switching_panitia_is_limited_to_assigned_ones_and_audited(): void
    {
        $science = $this->makePanitia('Science');
        $maths = $this->makePanitia('Mathematics');
        $ict = $this->makePanitia('ICT');
        $teacher = $this->makeTeacher([$science, $maths]);

        $this->actingAsUser($teacher)->postJson('/api/auth/switch-panitia', ['panitia_id' => $maths->id])
            ->assertOk()->assertJsonPath('active_panitia.id', $maths->id);
        $this->assertDatabaseHas('audit_logs', ['action' => 'PANITIA_SWITCHED', 'user_id' => $teacher->id]);

        $this->actingAsUser($teacher)->postJson('/api/auth/switch-panitia', ['panitia_id' => $ict->id])
            ->assertStatus(403);
    }

    public function test_teacher_panitia_relationship_exposes_the_primary_flag(): void
    {
        $science = $this->makePanitia('Science');
        $maths = $this->makePanitia('Mathematics');
        $teacher = $this->makeTeacher([$science, $maths]);

        $panitia = $teacher->panitia;

        $this->assertCount(2, $panitia);
        $this->assertEquals(1, $panitia->firstWhere('id', $science->id)->pivot->is_primary);
        $this->assertEquals(0, $panitia->firstWhere('id', $maths->id)->pivot->is_primary);
    }
}
