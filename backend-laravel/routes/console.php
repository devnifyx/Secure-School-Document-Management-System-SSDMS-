<?php

use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Weekly Activity Report submission window notifications.
// Requires the Laravel scheduler to actually run: `php artisan schedule:work` in dev,
// or a Task Scheduler / cron entry running `php artisan schedule:run` every minute in production.
Schedule::command('weekly-reports:notify-open')->weeklyOn(Carbon::SATURDAY, '00:00');
Schedule::command('weekly-reports:notify-deadline')->weeklyOn(Carbon::SUNDAY, '18:00');
Schedule::command('weekly-reports:notify-missed')->weeklyOn(Carbon::MONDAY, '00:05');
