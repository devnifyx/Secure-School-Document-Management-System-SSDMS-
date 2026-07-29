<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class SendWeeklyReportOpenNotifications extends Command
{
    protected $signature = 'weekly-reports:notify-open';
    protected $description = 'Notify all teachers that the weekly report submission period has opened';

    public function handle(): void
    {
        $week = now()->weekOfYear;

        $teachers = User::where('role', 'Teacher')
            ->where('is_active', true)
            ->where('account_status', 'Approved')
            ->get();

        foreach ($teachers as $teacher) {
            Notification::create([
                'user_id' => $teacher->id,
                'message' => "Weekly report submission is now open for Week {$week}. Submit by Sunday 11:59 PM.",
            ]);
        }

        logAudit('WEEKLY_REPORT_PERIOD_OPENED', null, null, "Week {$week} submission period opened", null);

        $this->info("Notified {$teachers->count()} teacher(s) that Week {$week} submission is open.");
    }
}
