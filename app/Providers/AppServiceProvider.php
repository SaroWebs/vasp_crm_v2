<?php

namespace App\Providers;

use App\Models\OrganizationUser;
use App\Models\Ticket;
use App\Models\User;
use App\Observers\TicketObserver;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Ticket::observe(TicketObserver::class);

        Event::listen(Login::class, function (Login $event): void {
            if ($event->user instanceof OrganizationUser || $event->guard === 'organization') {
                Auth::guard('web')->logout();
                Auth::guard('admin')->logout();

                return;
            }

            if ($event->user instanceof User || in_array($event->guard, ['web', 'admin'], true)) {
                Auth::guard('organization')->logout();
            }
        });

        // Ensure Carbon always uses the application's timezone
        date_default_timezone_set(config('app.timezone'));

        // Configure JSON serialization to always include timezone information
        Carbon::serializeUsing(function (CarbonInterface $carbon) {
            return $carbon->setTimezone(config('app.timezone'))->toISOString();
        });
    }
}
