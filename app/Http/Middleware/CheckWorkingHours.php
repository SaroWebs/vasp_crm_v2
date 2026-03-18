<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\WorkingHoursService;

class CheckWorkingHours
{
    protected WorkingHoursService $workingHoursService;

    public function __construct(WorkingHoursService $workingHoursService)
    {
        $this->workingHoursService = $workingHoursService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $now = now();
        
        if (!$this->workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours'
            ], 403);
        }

        return $next($request);
    }
}
