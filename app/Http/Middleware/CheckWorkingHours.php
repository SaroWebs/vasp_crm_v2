<?php

namespace App\Http\Middleware;

use App\Services\AttendanceDayPolicyService;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CheckWorkingHours
{
    public function __construct(private AttendanceDayPolicyService $dayPolicyService) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response|RedirectResponse)  $next
     * @return Response|RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $now = now();

        if (! $this->dayPolicyService->isWithinWorkingWindow($request->user()?->employee, $now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        return $next($request);
    }
}
