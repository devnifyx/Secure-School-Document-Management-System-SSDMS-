<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\Notification;
use App\Models\User;
use App\Models\WeeklyReport;
use App\Models\WeeklyReportAttachment;
use App\Services\FileEncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WeeklyReportController extends Controller
{
    private const ATTACHMENT_RULES = 'file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png';

    public function __construct(private FileEncryptionService $encryption)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = WeeklyReport::with(['submittedBy', 'panitia', 'attachments']);

        if ($user->role === 'Teacher') {
            $query->where('submitted_by', $user->id);
        } else {
            if ($request->has('submitted_by')) {
                $query->where('submitted_by', $request->submitted_by);
            }
            if ($request->has('panitia_id')) {
                $query->where('panitia_id', $request->panitia_id);
            }
        }

        if ($request->has('week_number')) {
            $query->where('week_number', $request->week_number);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->boolean('late_only')) {
            $query->where('is_late', true);
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($reports);
    }

    private function isWithinSubmissionWindow(): bool
    {
        return now()->isSaturday() || now()->isSunday();
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Teacher') {
            abort(403, 'Only teachers can submit weekly reports.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'week_number' => 'required|integer|min:1|max:53',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'activity_summary' => 'required|string',
            'challenges' => 'required|string',
            'actions_taken' => 'required|string',
            'next_week_plan' => 'required|string',
            'attachments' => 'nullable|array',
            'attachments.*' => self::ATTACHMENT_RULES,
        ]);

        $lateEnabled = AppSetting::get('late_submission_enabled', '0') === '1';
        $withinWindow = $this->isWithinSubmissionWindow();

        if (!$withinWindow && !$lateEnabled) {
            abort(422, 'Submission period is closed. Weekly reports can only be submitted on Saturday and Sunday.');
        }

        $panitiaId = $request->input('active_panitia_id');

        $report = WeeklyReport::create([
            'submitted_by' => $user->id,
            'panitia_id' => $panitiaId,
            'title' => $request->title,
            'week_number' => $request->week_number,
            'period_start' => $request->period_start,
            'period_end' => $request->period_end,
            'activity_summary' => $request->activity_summary,
            'challenges' => $request->challenges,
            'actions_taken' => $request->actions_taken,
            'next_week_plan' => $request->next_week_plan,
            'status' => 'Pending Review',
            'is_late' => !$withinWindow,
        ]);

        $this->storeAttachments($request, $report);

        logAudit('WEEKLY_REPORT_SUBMITTED', 'WeeklyReport', $report->id,
            "Week {$report->week_number} report submitted" . ($report->is_late ? ' (late)' : ''));

        $admins = User::where('role', 'Admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'message' => ($report->is_late ? '[Late Submission] ' : '') .
                    "New weekly report pending review: {$report->title} (Week {$report->week_number}, {$user->name})",
            ]);
            if ($report->is_late) {
                logAudit('WEEKLY_REPORT_LATE_RECEIVED', 'WeeklyReport', $report->id, "Late submission by {$user->name}");
            }
        }

        return response()->json($report->load(['submittedBy', 'panitia', 'attachments']), 201);
    }

    private function storeAttachments(Request $request, WeeklyReport $report): void
    {
        if (!$request->hasFile('attachments')) {
            return;
        }

        foreach ($request->file('attachments') as $file) {
            $plaintext = $file->get();
            $encrypted = $this->encryption->encrypt($plaintext);
            $fileName = $file->hashName();

            Storage::disk('local')->put('weekly-reports/' . $fileName, $encrypted['content']);

            WeeklyReportAttachment::create([
                'weekly_report_id' => $report->id,
                'file_path' => 'weekly-reports/' . $fileName,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'encrypted_key' => $encrypted['key'],
                'file_hash' => $encrypted['hash'],
            ]);
        }
    }

    private function checkAccess(Request $request, WeeklyReport $report): void
    {
        $user = $request->user();
        if ($user->role === 'Teacher' && $report->submitted_by !== $user->id) {
            logAudit('UNAUTHORIZED_WEEKLY_REPORT_ACCESS', 'WeeklyReport', $report->id, 'Cross-user access attempt');
            abort(403, 'You do not have access to this report.');
        }
    }

    public function show(Request $request, $id)
    {
        $report = WeeklyReport::with(['submittedBy', 'panitia', 'attachments'])->findOrFail($id);
        $this->checkAccess($request, $report);
        return response()->json($report);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $report = WeeklyReport::findOrFail($id);
        $this->checkAccess($request, $report);

        if ($user->role === 'Teacher' && $report->status !== 'Rejected') {
            abort(403, 'Can only edit rejected reports.');
        }

        $request->validate([
            'title' => 'string|max:255',
            'activity_summary' => 'string',
            'challenges' => 'string',
            'actions_taken' => 'string',
            'next_week_plan' => 'string',
            'attachments' => 'nullable|array',
            'attachments.*' => self::ATTACHMENT_RULES,
        ]);

        $report->update($request->only([
            'title', 'activity_summary', 'challenges', 'actions_taken', 'next_week_plan',
        ]));

        $this->storeAttachments($request, $report);

        if ($user->role === 'Teacher') {
            $report->update(['status' => 'Pending Review', 'rejection_reason' => null]);

            $admins = User::where('role', 'Admin')->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'message' => "Weekly report resubmitted for review: {$report->title} (Week {$report->week_number}, {$user->name})",
                ]);
            }
            logAudit('WEEKLY_REPORT_RESUBMITTED', 'WeeklyReport', $report->id);
        } else {
            logAudit('WEEKLY_REPORT_EDITED', 'WeeklyReport', $report->id);
        }

        return response()->json($report->load(['submittedBy', 'panitia', 'attachments']));
    }

    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        $report = WeeklyReport::findOrFail($id);

        $report->update(['status' => 'Approved', 'rejection_reason' => null]);

        logAudit('WEEKLY_REPORT_APPROVED', 'WeeklyReport', $report->id, "Approved by: {$admin->name}");

        Notification::create([
            'user_id' => $report->submitted_by,
            'message' => "Your weekly report '{$report->title}' (Week {$report->week_number}) has been approved!",
        ]);

        return response()->json($report->load(['submittedBy', 'panitia', 'attachments']));
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $request->validate(['reason' => 'required|string']);
        $report = WeeklyReport::findOrFail($id);

        $report->update(['status' => 'Rejected', 'rejection_reason' => $request->reason]);

        logAudit('WEEKLY_REPORT_REJECTED', 'WeeklyReport', $report->id, "Rejected by: {$admin->name}, Reason: {$request->reason}");

        Notification::create([
            'user_id' => $report->submitted_by,
            'message' => "Your weekly report '{$report->title}' (Week {$report->week_number}) was rejected. Reason: {$request->reason}",
        ]);

        return response()->json($report->load(['submittedBy', 'panitia', 'attachments']));
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $report = WeeklyReport::with('attachments')->findOrFail($id);
        $this->checkAccess($request, $report);

        if ($user->role === 'Teacher' && $report->status !== 'Pending Review') {
            abort(403, 'Can only delete reports that are still pending review.');
        }

        foreach ($report->attachments as $attachment) {
            Storage::disk('local')->delete($attachment->file_path);
        }
        $report->delete();

        logAudit('WEEKLY_REPORT_DELETED', 'WeeklyReport', $id);

        return response()->json(null, 204);
    }

    private function streamAttachment(Request $request, $reportId, $attachmentId, string $disposition)
    {
        $report = WeeklyReport::findOrFail($reportId);
        $this->checkAccess($request, $report);
        $attachment = WeeklyReportAttachment::where('weekly_report_id', $reportId)->findOrFail($attachmentId);

        $stored = Storage::disk('local')->get($attachment->file_path);
        $decrypted = $this->encryption->decrypt($stored, $attachment->encrypted_key);

        logAudit('WEEKLY_REPORT_ATTACHMENT_' . ($disposition === 'inline' ? 'PREVIEWED' : 'DOWNLOADED'),
            'WeeklyReport', $report->id, $attachment->file_name);

        return response()->streamDownload(
            function () use ($decrypted) { echo $decrypted; },
            $attachment->file_name,
            ['Content-Type' => $attachment->file_type],
            $disposition
        );
    }

    public function downloadAttachment(Request $request, $reportId, $attachmentId)
    {
        return $this->streamAttachment($request, $reportId, $attachmentId, 'attachment');
    }

    public function previewAttachment(Request $request, $reportId, $attachmentId)
    {
        return $this->streamAttachment($request, $reportId, $attachmentId, 'inline');
    }

    public function notSubmitted(Request $request)
    {
        $request->validate(['week_number' => 'required|integer']);
        $weekNumber = $request->week_number;

        $query = User::where('role', 'Teacher')
            ->where('is_active', true)
            ->where('account_status', 'Approved')
            ->whereDoesntHave('weeklyReports', function ($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            })
            ->with('panitia');

        if ($request->has('panitia_id')) {
            $query->whereHas('panitia', fn ($q) => $q->where('panitia.id', $request->panitia_id));
        }

        return response()->json($query->get(['id', 'name', 'email']));
    }

    public function getLateSubmissionSetting()
    {
        return response()->json([
            'late_submission_enabled' => AppSetting::get('late_submission_enabled', '0') === '1',
        ]);
    }

    public function updateLateSubmissionSetting(Request $request)
    {
        $admin = $request->user();
        $request->validate(['enabled' => 'required|boolean']);

        AppSetting::set('late_submission_enabled', $request->boolean('enabled') ? '1' : '0');

        logAudit('WEEKLY_REPORT_LATE_SETTING_CHANGED', null, null,
            "Late submission " . ($request->boolean('enabled') ? 'enabled' : 'disabled') . " by {$admin->name}");

        return response()->json(['late_submission_enabled' => $request->boolean('enabled')]);
    }
}
