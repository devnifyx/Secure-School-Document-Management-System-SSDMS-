<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class SendWeeklyReportDeadlineReminders extends Command
{
    protected $signature = 'weekly-reports:notify-deadline';
    protected $description = 'Remind teachers who have not yet submitted that the weekly report deadline is approaching';

    public function handle(): void
    {
        $week = now()->weekOfYear;

        $pending = User::where('role', 'Teacher')
            ->where('is_active', true)
            ->where('account_status', 'Approved')
            ->whereDoesntHave('weeklyReports', fn ($q) => $q->where('week_number', $week))
            ->get();

        foreach ($pending as $teacher) {
            Notification::create([
                'user_id' => $teacher->id,
                'message' => "Reminder: Week {$week} weekly report is due tonight by 11:59 PM.",
            ]);
        }

        $this->info("Sent deadline reminders to {$pending->count()} teacher(s) for Week {$week}.");
    }
}
