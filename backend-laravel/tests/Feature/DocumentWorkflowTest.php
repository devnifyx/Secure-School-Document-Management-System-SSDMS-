<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Notification;
use App\Models\Panitia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class DocumentWorkflowTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    private const PLAINTEXT = 'MID-YEAR EXAM PAPER: question 1, question 2, question 3';

    private Panitia $science;
    private Panitia $maths;
    private User $admin;
    private User $teacher;
    private User $colleague;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->science = $this->makePanitia('Science');
        $this->maths = $this->makePanitia('Mathematics');
        $this->admin = $this->makeAdmin();
        $this->teacher = $this->makeTeacher([$this->science]);
        $this->colleague = $this->makeTeacher([$this->maths]);
    }

    private function upload(?User $as = null, ?Panitia $in = null, string $content = self::PLAINTEXT)
    {
        $as ??= $this->teacher;
        $in ??= $this->science;

        return $this->actingAsUser($as, $in)->post('/api/documents', [
            'title' => 'Mid-year paper',
            'category' => 'Assessments',
            'panitia_id' => $in->id,
            'file' => UploadedFile::fake()->createWithContent('paper.pdf', $content),
        ], ['Accept' => 'application/json']);
    }

    private function storedDocument(): Document
    {
        return Document::firstOrFail();
    }

    public function test_upload_is_encrypted_hashed_and_queued_for_approval(): void
    {
        $this->upload()->assertCreated();

        $doc = $this->storedDocument();
        $stored = Storage::disk('local')->get($doc->file_path);

        $this->assertSame('Pending', $doc->status);
        $this->assertSame($this->science->id, $doc->panitia_id);
        $this->assertSame(hash('sha256', self::PLAINTEXT), $doc->file_hash);
        $this->assertSame(32, strlen(base64_decode($doc->encrypted_key, true)));
        $this->assertStringNotContainsString('MID-YEAR EXAM PAPER', $stored);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DOCUMENT_UPLOADED', 'user_id' => $this->teacher->id]);
        $this->assertTrue(
            Notification::where('user_id', $this->admin->id)->where('message', 'like', 'New document pending approval%')->exists()
        );
    }

    public function test_teacher_cannot_upload_into_a_department_they_are_not_working_in(): void
    {
        $this->actingAsUser($this->teacher, $this->science)->post('/api/documents', [
            'title' => 'Sneaky',
            'category' => 'Other',
            'panitia_id' => $this->maths->id,
            'file' => UploadedFile::fake()->createWithContent('x.pdf', 'x'),
        ], ['Accept' => 'application/json'])->assertStatus(403);

        $this->assertSame(0, Document::count());
    }

    public function test_teacher_cannot_download_a_document_that_is_not_approved_yet(): void
    {
        $this->upload();

        $this->actingAsUser($this->teacher, $this->science)
            ->get("/api/documents/{$this->storedDocument()->id}/download")
            ->assertStatus(403);
    }

    public function test_approval_notifies_the_teacher_and_unlocks_an_identical_download(): void
    {
        $this->upload();
        $doc = $this->storedDocument();

        $this->actingAsUser($this->admin)->postJson("/api/documents/{$doc->id}/approve")->assertOk();

        $this->assertSame('Approved', $doc->fresh()->status);
        $this->assertTrue(Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%approved%')->exists());

        // decrypting repeatedly always gives back the same bytes
        for ($i = 0; $i < 3; $i++) {
            $response = $this->actingAsUser($this->teacher, $this->science)->get("/api/documents/{$doc->id}/download");
            $response->assertOk();
            $this->assertSame(self::PLAINTEXT, $response->streamedContent());
        }
    }

    public function test_rejection_needs_a_reason_and_the_teacher_can_resubmit(): void
    {
        $this->upload();
        $doc = $this->storedDocument();

        $this->actingAsUser($this->admin)->postJson("/api/documents/{$doc->id}/reject", [])->assertStatus(422);

        $this->actingAsUser($this->admin)
            ->postJson("/api/documents/{$doc->id}/reject", ['reason' => 'Answer key missing'])->assertOk();

        $this->assertSame('Rejected', $doc->fresh()->status);
        $this->assertSame('Answer key missing', $doc->fresh()->rejection_reason);
        $this->assertTrue(Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%Answer key missing%')->exists());

        $this->actingAsUser($this->teacher, $this->science)
            ->putJson("/api/documents/{$doc->id}", ['title' => 'Mid-year paper (revised)'])->assertOk();

        $doc->refresh();
        $this->assertSame('Pending', $doc->status);
        $this->assertNull($doc->rejection_reason);
        $this->assertSame(1, Document::count(), 'resubmission must not create a duplicate record');
    }

    public function test_teacher_can_only_edit_rejected_documents(): void
    {
        $this->upload();

        $this->actingAsUser($this->teacher, $this->science)
            ->putJson("/api/documents/{$this->storedDocument()->id}", ['title' => 'Changed'])
            ->assertStatus(403);
    }

    public function test_teacher_cannot_see_documents_from_another_department(): void
    {
        $this->upload();
        $doc = $this->storedDocument();

        $this->actingAsUser($this->colleague, $this->maths)->getJson('/api/documents')
            ->assertOk()->assertJsonCount(0, 'data');

        $this->actingAsUser($this->colleague, $this->maths)->getJson("/api/documents/{$doc->id}")->assertStatus(403);
        $this->actingAsUser($this->colleague, $this->maths)->get("/api/documents/{$doc->id}/download")->assertStatus(403);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'UNAUTHORIZED_DOCUMENT_ACCESS',
            'user_id' => $this->colleague->id,
            'entity_id' => $doc->id,
        ]);
    }

    public function test_verify_reports_intact_for_an_untouched_file(): void
    {
        $this->upload();
        $doc = $this->storedDocument();

        $this->actingAsUser($this->admin)->postJson("/api/documents/{$doc->id}/verify")
            ->assertOk()
            ->assertJsonPath('status', 'intact')
            ->assertJsonPath('stored_hash', $doc->file_hash)
            ->assertJsonPath('current_hash', $doc->file_hash);

        $this->assertDatabaseHas('audit_logs', ['action' => 'DOCUMENT_VERIFY_PASSED', 'entity_id' => $doc->id]);
    }

    public function test_verify_detects_a_single_altered_byte_in_the_stored_ciphertext(): void
    {
        $this->upload(content: str_repeat('exam question ', 40));
        $doc = $this->storedDocument();

        $bytes = Storage::disk('local')->get($doc->file_path);
        $bytes[20] = chr(ord($bytes[20]) ^ 0x01);
        Storage::disk('local')->put($doc->file_path, $bytes);

        $status = $this->actingAsUser($this->admin)->postJson("/api/documents/{$doc->id}/verify")
            ->assertOk()->json('status');

        $this->assertContains($status, ['tampered', 'corrupted']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DOCUMENT_VERIFY_FAILED', 'entity_id' => $doc->id]);
    }

    public function test_verify_reports_a_missing_file(): void
    {
        $this->upload();
        $doc = $this->storedDocument();
        Storage::disk('local')->delete($doc->file_path);

        $this->actingAsUser($this->admin)->postJson("/api/documents/{$doc->id}/verify")
            ->assertOk()->assertJsonPath('status', 'missing');
    }

    public function test_only_admins_can_verify_approve_or_reject(): void
    {
        $this->upload();
        $doc = $this->storedDocument();
        $this->actingAsUser($this->teacher, $this->science);

        $this->postJson("/api/documents/{$doc->id}/verify")->assertStatus(403);
        $this->postJson("/api/documents/{$doc->id}/approve")->assertStatus(403);
        $this->postJson("/api/documents/{$doc->id}/reject", ['reason' => 'x'])->assertStatus(403);
    }

    public function test_failed_database_write_leaves_no_orphaned_encrypted_file(): void
    {
        Document::creating(function () {
            throw new \RuntimeException('simulated database failure');
        });

        $this->upload()->assertStatus(500);

        $this->assertSame(0, Document::count());
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
    }
}
