<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Panitia;
use App\Models\User;
use App\Models\WeeklyReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesSsdmsData;
use Tests\TestCase;

class WeeklyReportTest extends TestCase
{
    use RefreshDatabase, CreatesSsdmsData;

    private const SATURDAY = '2026-10-03 10:00:00';
    private const SUNDAY = '2026-10-04 20:00:00';
    private const WEDNESDAY = '2026-10-07 10:00:00';

    private Panitia $science;
    private User $admin;
    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->science = $this->makePanitia('Science');
        $this->admin = $this->makeAdmin();
        $this->teacher = $this->makeTeacher([$this->science]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function payload(array $extra = []): array
    {
        return array_merge([
            'title' => 'Week 40 report',
            'week_number' => 40,
            'period_start' => '2026-09-28',
            'period_end' => '2026-10-04',
            'activity_summary' => 'Taught Form 4 chapters 3 and 4.',
            'challenges' => 'Some students missed the lab session.',
            'actions_taken' => 'Arranged a make-up session.',
            'next_week_plan' => 'Start chapter 5.',
        ], $extra);
    }

    private function submit(array $extra = [], ?User $as = null)
    {
        return $this->actingAsUser($as ?? $this->teacher, $this->science)
            ->post('/api/weekly-reports', $this->payload($extra), ['Accept' => 'application/json']);
    }

    public function test_report_submitted_on_saturday_or_sunday_is_on_time(): void
    {
        foreach ([self::SATURDAY, self::SUNDAY] as $moment) {
            Carbon::setTestNow($moment);
            $this->submit()->assertCreated()->assertJsonPath('is_late', false);
        }

        $this->assertSame(0, WeeklyReport::where('is_late', true)->count());
    }

    public function test_report_on_a_weekday_is_accepted_but_flagged_late(): void
    {
        Carbon::setTestNow(self::WEDNESDAY);

        $this->submit()->assertCreated()
            ->assertJsonPath('is_late', true)
            ->assertJsonPath('status', 'Pending Review');

        $this->assertDatabaseHas('audit_logs', ['action' => 'WEEKLY_REPORT_LATE_RECEIVED']);
    }

    public function test_late_report_with_attachments_encrypts_each_file_and_notifies_admins(): void
    {
        Carbon::setTestNow(self::WEDNESDAY);

        $response = $this->submit(['attachments' => [
            UploadedFile::fake()->createWithContent('lab-photo.pdf', 'FIRST ATTACHMENT BODY'),
            UploadedFile::fake()->createWithContent('marks.xlsx', 'SECOND ATTACHMENT BODY'),
        ]])->assertCreated();

        $report = WeeklyReport::with('attachments')->findOrFail($response->json('id'));
        $this->assertCount(2, $report->attachments);

        foreach ($report->attachments as $attachment) {
            $stored = Storage::disk('local')->get($attachment->file_path);
            $this->assertStringNotContainsString('ATTACHMENT BODY', $stored);
            $this->assertSame(32, strlen(base64_decode($attachment->encrypted_key, true)));
        }
        $this->assertNotSame($report->attachments[0]->encrypted_key, $report->attachments[1]->encrypted_key);

        $this->assertTrue(
            Notification::where('user_id', $this->admin->id)->where('message', 'like', '[Late Submission]%')->exists()
        );
    }

    public function test_attachment_downloads_back_to_the_original_content(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $report = $this->submit(['attachments' => [UploadedFile::fake()->createWithContent('evidence.pdf', 'EVIDENCE BODY')]])
            ->assertCreated();
        $attachmentId = $report->json('attachments.0.id');

        $this->actingAsUser($this->teacher, $this->science)
            ->get("/api/weekly-reports/{$report->json('id')}/attachments/{$attachmentId}/download")
            ->assertOk();

        $download = $this->actingAsUser($this->admin)
            ->get("/api/weekly-reports/{$report->json('id')}/attachments/{$attachmentId}/download");
        $this->assertSame('EVIDENCE BODY', $download->streamedContent());
    }

    public function test_disallowed_attachment_types_are_rejected(): void
    {
        Carbon::setTestNow(self::SATURDAY);

        $this->submit(['attachments' => [UploadedFile::fake()->create('virus.exe', 10)]])->assertStatus(422);
        $this->assertSame(0, WeeklyReport::count());
    }

    public function test_every_report_field_is_required(): void
    {
        Carbon::setTestNow(self::SATURDAY);

        foreach (['title', 'week_number', 'period_start', 'period_end', 'activity_summary', 'challenges', 'actions_taken', 'next_week_plan'] as $field) {
            $data = $this->payload();
            unset($data[$field]);

            $this->actingAsUser($this->teacher, $this->science)
                ->postJson('/api/weekly-reports', $data)->assertStatus(422)->assertJsonValidationErrors($field);
        }
    }

    public function test_administrators_cannot_submit_reports(): void
    {
        $this->submit(as: $this->admin)->assertStatus(403);
    }

    public function test_teachers_only_see_their_own_reports(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $mine = $this->submit()->json('id');

        $colleague = $this->makeTeacher([$this->science]);
        $theirs = $this->submit(as: $colleague)->json('id');

        $this->actingAsUser($this->teacher, $this->science)->getJson('/api/weekly-reports')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mine);

        $this->actingAsUser($this->teacher, $this->science)->getJson("/api/weekly-reports/{$theirs}")->assertStatus(403);
        $this->actingAsUser($this->admin)->getJson('/api/weekly-reports')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_rejection_needs_a_reason_and_the_teacher_can_edit_and_resubmit(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $id = $this->submit()->json('id');

        $this->actingAsUser($this->admin)->postJson("/api/weekly-reports/{$id}/reject", [])->assertStatus(422);
        $this->actingAsUser($this->admin)->postJson("/api/weekly-reports/{$id}/reject", ['reason' => 'Add more detail'])->assertOk();

        $this->assertSame('Rejected', WeeklyReport::find($id)->status);
        $this->assertTrue(Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%Add more detail%')->exists());

        $this->actingAsUser($this->teacher, $this->science)
            ->putJson("/api/weekly-reports/{$id}", ['activity_summary' => 'Expanded summary.'])->assertOk();

        $report = WeeklyReport::find($id);
        $this->assertSame('Pending Review', $report->status);
        $this->assertNull($report->rejection_reason);
        $this->assertDatabaseHas('audit_logs', ['action' => 'WEEKLY_REPORT_RESUBMITTED', 'entity_id' => $id]);
    }

    public function test_teachers_can_only_edit_rejected_reports(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $id = $this->submit()->json('id');

        $this->actingAsUser($this->teacher, $this->science)
            ->putJson("/api/weekly-reports/{$id}", ['title' => 'Changed'])->assertStatus(403);
    }

    public function test_approval_notifies_the_teacher(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $id = $this->submit()->json('id');

        $this->actingAsUser($this->admin)->postJson("/api/weekly-reports/{$id}/approve")->assertOk();

        $this->assertSame('Approved', WeeklyReport::find($id)->status);
        $this->assertTrue(Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%approved%')->exists());
    }

    public function test_tracker_lists_teachers_who_have_not_submitted(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $this->submit();

        $this->makeTeacher([$this->science], ['name' => 'Missing Teacher']);
        $this->makeTeacher([$this->science], ['name' => 'Pending Teacher', 'account_status' => 'Pending']);
        $this->makeTeacher([$this->science], ['name' => 'Inactive Teacher', 'is_active' => false]);

        $names = collect(
            $this->actingAsUser($this->admin)->getJson('/api/weekly-reports-not-submitted?week_number=40')->assertOk()->json()
        )->pluck('name');

        $this->assertSame(['Missing Teacher'], $names->all());
    }

    public function test_report_filters_by_week_status_and_late_flag(): void
    {
        Carbon::setTestNow(self::WEDNESDAY);
        $late = $this->submit()->json('id');
        Carbon::setTestNow(self::SATURDAY);
        $onTime = $this->submit(['week_number' => 41])->json('id');

        $admin = $this->actingAsUser($this->admin);

        $this->assertSame([$late], collect($admin->getJson('/api/weekly-reports?late_only=1')->json('data'))->pluck('id')->all());
        $this->assertSame([$onTime], collect($admin->getJson('/api/weekly-reports?week_number=41')->json('data'))->pluck('id')->all());
        $this->assertCount(2, $admin->getJson('/api/weekly-reports?status=Pending%20Review')->json('data'));
    }

    public function test_window_open_reminder_goes_to_every_approved_active_teacher(): void
    {
        Carbon::setTestNow(self::SATURDAY);
        $second = $this->makeTeacher([$this->science]);
        $this->makeTeacher([$this->science], ['account_status' => 'Pending']);

        $this->artisan('weekly-reports:notify-open')->assertSuccessful();

        $this->assertSame(1, Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%now open%')->count());
        $this->assertSame(1, Notification::where('user_id', $second->id)->where('message', 'like', '%now open%')->count());
        $this->assertSame(2, Notification::where('message', 'like', '%now open%')->count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'WEEKLY_REPORT_PERIOD_OPENED']);
    }

    public function test_deadline_reminder_only_goes_to_teachers_who_have_not_submitted(): void
    {
        Carbon::setTestNow(self::SUNDAY);
        $this->submit();
        $waiting = $this->makeTeacher([$this->science]);

        $this->artisan('weekly-reports:notify-deadline')->assertSuccessful();

        $this->assertSame(0, Notification::where('user_id', $this->teacher->id)->where('message', 'like', 'Reminder:%')->count());
        $this->assertSame(1, Notification::where('user_id', $waiting->id)->where('message', 'like', 'Reminder:%')->count());
    }

    public function test_missed_deadline_sweep_notifies_the_teacher_and_the_admins(): void
    {
        Carbon::setTestNow(self::SUNDAY);
        $this->submit();
        $missed = $this->makeTeacher([$this->science], ['name' => 'Late Larry']);

        Carbon::setTestNow('2026-10-05 00:05:00'); // Monday, just after the deadline
        $this->artisan('weekly-reports:notify-missed')->assertSuccessful();

        $this->assertTrue(Notification::where('user_id', $missed->id)->where('message', 'like', '%did not submit%')->exists());
        $this->assertFalse(Notification::where('user_id', $this->teacher->id)->where('message', 'like', '%did not submit%')->exists());
        $this->assertTrue(Notification::where('user_id', $this->admin->id)->where('message', 'like', '%Late Larry%')->exists());
        $this->assertDatabaseHas('audit_logs', ['action' => 'WEEKLY_REPORT_MISSED', 'entity_id' => $missed->id]);
    }
}
