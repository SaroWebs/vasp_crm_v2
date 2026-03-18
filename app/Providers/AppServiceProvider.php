<?php

namespace App\Providers;

use App\Models\Ticket;
use App\Observers\TicketObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Carbon\CarbonInterface;

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
        
        // Ensure Carbon always uses the application's timezone
        date_default_timezone_set(config('app.timezone'));
        
        // Configure JSON serialization to always include timezone information
        Carbon::serializeUsing(function (CarbonInterface $carbon) {
            return $carbon->setTimezone(config('app.timezone'))->toISOString();
        });
    }
}
