<?php

use Carbon\Carbon;
use Illuminate\Support\Facades\Schedule;

// Weekly report reminders. Needs `php artisan schedule:work` (dev) or a cron / Task Scheduler
// entry running `php artisan schedule:run` every minute.
Schedule::command('weekly-reports:notify-open')->weeklyOn(Carbon::SATURDAY, '00:00');
Schedule::command('weekly-reports:notify-deadline')->weeklyOn(Carbon::SUNDAY, '18:00');
Schedule::command('weekly-reports:notify-missed')->weeklyOn(Carbon::MONDAY, '00:05');
