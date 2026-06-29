<?php

namespace App\Http\Controllers;

use App\Models\MonthlyCycleRule;
use App\Services\MonthlyCycleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MonthlyCycleRuleController extends Controller
{
    public function __construct(
        private MonthlyCycleService $monthlyCycleService
    ) {}

    /**
     * Inertia page for managing cycle rules.
     */
    public function page(): Response
    {
        return Inertia::render('admin/attendance/CycleRules');
    }

    /**
     * List all cycle rules ordered chronologically.
     */
    public function index(): JsonResponse
    {
        $rules = MonthlyCycleRule::query()
            ->with('creator:id,name')
            ->orderBy('effective_from')
            ->get()
            ->map(fn (MonthlyCycleRule $rule) => [
                'id' => $rule->id,
                'month_starts_on' => $rule->month_starts_on,
                'effective_from' => $rule->effective_from->toDateString(),
                'effective_to' => $rule->effective_to?->toDateString(),
                'include_gap_in_current' => $rule->include_gap_in_current,
                'created_at' => $rule->created_at->toIso8601String(),
                'creator' => $rule->creator ? ['name' => $rule->creator->name] : null,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $rules,
        ]);
    }

    /**
     * Store a new cycle rule.
     * Automatically closes the currently active rule's effective_to if it is null.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month_starts_on' => ['required', 'integer', 'min:1', 'max:31'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after:effective_from'],
            'include_gap_in_current' => ['boolean'],
        ]);

        // Close the previous active rule (effective_to = null) the day before new rule starts
        $newFrom = Carbon::parse($validated['effective_from']);

        MonthlyCycleRule::query()
            ->whereNull('effective_to')
            ->where('effective_from', '<', $newFrom)
            ->update(['effective_to' => $newFrom->copy()->subDay()->toDateString()]);

        $rule = MonthlyCycleRule::create([
            'month_starts_on' => $validated['month_starts_on'],
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
            'include_gap_in_current' => $validated['include_gap_in_current'] ?? true,
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cycle rule created successfully.',
            'data' => $rule,
        ], 201);
    }

    /**
     * Update an existing cycle rule.
     */
    public function update(Request $request, MonthlyCycleRule $monthlyCycleRule): JsonResponse
    {
        $validated = $request->validate([
            'month_starts_on' => ['required', 'integer', 'min:1', 'max:31'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after:effective_from'],
            'include_gap_in_current' => ['boolean'],
        ]);

        $monthlyCycleRule->update([
            'month_starts_on' => $validated['month_starts_on'],
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
            'include_gap_in_current' => $validated['include_gap_in_current'] ?? $monthlyCycleRule->include_gap_in_current,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cycle rule updated successfully.',
        ]);
    }

    /**
     * Preview the first few derived op_months for a candidate rule config.
     * Used by the frontend form to show a live preview before saving.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month_starts_on' => ['required', 'integer', 'min:1', 'max:31'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date'],
            'include_gap_in_current' => ['boolean'],
        ]);

        $from = Carbon::parse($validated['effective_from']);
        $to = isset($validated['effective_to']) ? Carbon::parse($validated['effective_to']) : null;
        $d = (int) $validated['month_starts_on'];
        $includeGap = (bool) ($validated['include_gap_in_current'] ?? true);

        // Build a temporary preview without persisting
        $preview = [];
        $cursor = $from->copy();
        $maxDays = $to ? $from->diffInDays($to) + 1 : 120;

        // First cycle start
        $firstCycleStart = $cursor->copy();

        // Check for gap from previous rule
        $prevRule = MonthlyCycleRule::query()
            ->orderBy('effective_from', 'desc')
            ->where('effective_from', '<', $from)
            ->first();

        $gapWarning = null;

        if ($prevRule && $prevRule->effective_to) {
            $gapDays = $prevRule->effective_to->diffInDays($from, false);

            if ($gapDays > 1) {
                $gapCount = (int) abs($gapDays) - 1;
                $gapStart = $prevRule->effective_to->copy()->addDay()->toDateString();
                $gapEnd = $from->copy()->subDay()->toDateString();

                $gapWarning = "There is a {$gapCount}-day gap ({$gapStart} to {$gapEnd}) between the previous rule and this one."
                    .($includeGap ? ' These days will be absorbed into the first cycle of this rule.' : ' These days will be untracked.');

                if ($includeGap) {
                    $firstCycleStart = $prevRule->effective_to->copy()->addDay();
                }
            }
        }

        // Generate up to 5 preview cycles
        $cycleStart = $firstCycleStart->copy();

        for ($i = 0; $i < 5; $i++) {
            // Next cycle anchor
            $anchorCandidate = $this->setDayOfMonth($cycleStart->copy(), $d);

            if ($cycleStart->lt($anchorCandidate)) {
                $nextCycleStart = $anchorCandidate->copy();
            } else {
                $nextCycleStart = $this->setDayOfMonth($cycleStart->copy()->addMonth(), $d);
            }

            $cycleEnd = $nextCycleStart->copy()->subDay();

            if ($to && $cycleEnd->gt($to)) {
                $cycleEnd = $to->copy();
            }

            $label = $this->formatLabel($cycleStart, $cycleEnd);

            $preview[] = [
                'label' => $label,
                'start_date' => $cycleStart->toDateString(),
                'end_date' => $cycleEnd->toDateString(),
            ];

            if ($to && $cycleEnd->gte($to)) {
                break;
            }

            $cycleStart = $nextCycleStart->copy();
        }

        return response()->json([
            'status' => 'success',
            'preview' => $preview,
            'gap_warning' => $gapWarning,
        ]);
    }

    /**
     * Return the current and previous op_month derived from the active rule.
     * Used by attendance views to scope their date range.
     */
    public function currentOpMonth(): JsonResponse
    {
        $current = $this->monthlyCycleService->getCurrentOpMonth();
        $previous = $this->monthlyCycleService->getLastCompletedOpMonth();

        return response()->json([
            'status' => 'success',
            'current' => $this->formatOpMonthForJson($current),
            'previous' => $previous ? $this->formatOpMonthForJson($previous) : null,
        ]);
    }

    /**
     * Resolve the op_month for a specific date.
     */
    public function resolveDate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $opMonth = $this->monthlyCycleService->resolveOpMonth(Carbon::parse($validated['date']));

        return response()->json([
            'status' => 'success',
            'op_month' => $this->formatOpMonthForJson($opMonth),
        ]);
    }

    /**
     * List all derived op_months that have started by today.
     */
    public function listOpMonths(Request $request): JsonResponse
    {
        $upTo = Carbon::today();
        $opMonths = $this->monthlyCycleService->deriveAllOpMonths($upTo);

        $formatted = array_map(
            fn (array $om) => $this->formatOpMonthForJson($om),
            $opMonths
        );

        // Sort descending so the most recent month is first
        usort($formatted, fn ($a, $b) => strcmp($b['start_date'], $a['start_date']));

        return response()->json([
            'status' => 'success',
            'data' => $formatted,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $opMonth
     * @return array<string, mixed>
     */
    private function formatOpMonthForJson(array $opMonth): array
    {
        return [
            'label' => $opMonth['label'],
            'start_date' => $opMonth['start_date'] instanceof Carbon
                ? $opMonth['start_date']->toDateString()
                : $opMonth['start_date'],
            'end_date' => $opMonth['end_date'] instanceof Carbon
                ? $opMonth['end_date']->toDateString()
                : $opMonth['end_date'],
            'rule_id' => $opMonth['rule_id'],
            'is_first_cycle' => $opMonth['is_first_cycle'],
            'has_gap_prefix' => $opMonth['has_gap_prefix'],
            'gap_start_date' => isset($opMonth['gap_start_date']) && $opMonth['gap_start_date'] instanceof Carbon
                ? $opMonth['gap_start_date']->toDateString()
                : ($opMonth['gap_start_date'] ?? null),
        ];
    }

    /**
     * Clamp day to last valid day of month (e.g. day 31 in February → 28/29).
     */
    private function setDayOfMonth(Carbon $date, int $day): Carbon
    {
        return $date->day(min($day, $date->daysInMonth));
    }

    /**
     * Format a human-readable label for a date range.
     */
    private function formatLabel(Carbon $start, Carbon $end): string
    {
        if ($start->year === $end->year) {
            return $start->format('M d').' – '.$end->format('M d, Y');
        }

        return $start->format('M d, Y').' – '.$end->format('M d, Y');
    }
}
