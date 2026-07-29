<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class SendWeeklyReportMissedNotifications extends Command
{
    protected $signature = 'weekly-reports:notify-missed';
    protected $description = 'Notify teachers and admins about weekly reports that were not submitted before the deadline';

    public function handle(): void
    {
        $week = now()->subDay()->weekOfYear; // the week that just closed (command runs just after Sunday midnight)

        $missed = User::where('role', 'Teacher')
            ->where('is_active', true)
            ->where('account_status', 'Approved')
            ->whereDoesntHave('weeklyReports', fn ($q) => $q->where('week_number', $week))
            ->get();

        foreach ($missed as $teacher) {
            Notification::create([
                'user_id' => $teacher->id,
                'message' => "You did not submit your Week {$week} weekly report before the deadline.",
            ]);
            logAudit('WEEKLY_REPORT_MISSED', 'User', $teacher->id, "Missed Week {$week} deadline", null);
        }

        if ($missed->isNotEmpty()) {
            $admins = User::where('role', 'Admin')->get();
            $names = $missed->pluck('name')->join(', ');
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'message' => "{$missed->count()} teacher(s) missed the Week {$week} report deadline: {$names}",
                ]);
            }
        }

        $this->info("Flagged {$missed->count()} missed submission(s) for Week {$week}.");
    }
}
