<?php

namespace App\Services;

use App\Models\MonthlyCycleRule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class MonthlyCycleService
{
    /**
     * Resolve the operational month (op_month) that a given date falls into.
     *
     * Returns an array with:
     *   - start_date  : Carbon  (inclusive)
     *   - end_date    : Carbon  (inclusive)
     *   - label       : string  e.g. "Apr 21 – May 20, 2026"
     *   - rule_id     : int
     *   - is_first_cycle : bool
     *   - has_gap_prefix : bool
     *   - gap_start_date : Carbon|null
     *
     * @return array<string, mixed>
     */
    public function resolveOpMonth(Carbon $targetDate): array
    {
        /** @var Collection<int, MonthlyCycleRule> $rules */
        $rules = MonthlyCycleRule::query()
            ->orderBy('effective_from')
            ->get();

        if ($rules->isEmpty()) {
            // Fallback: use calendar month
            return [
                'start_date' => $targetDate->copy()->startOfMonth(),
                'end_date' => $targetDate->copy()->endOfMonth(),
                'label' => $targetDate->format('M Y'),
                'rule_id' => null,
                'is_first_cycle' => false,
                'has_gap_prefix' => false,
                'gap_start_date' => null,
            ];
        }

        // Find the rule that directly covers targetDate
        $rule = $rules->first(function (MonthlyCycleRule $r) use ($targetDate) {
            return $targetDate->gte($r->effective_from)
                && ($r->effective_to === null || $targetDate->lte($r->effective_to));
        });

        // Handle gap: targetDate falls between two rules
        if ($rule === null) {
            $nextRule = $rules->first(fn (MonthlyCycleRule $r) => $r->effective_from->gt($targetDate));

            if ($nextRule && $nextRule->include_gap_in_current) {
                return $this->buildFirstCycle($nextRule, $rules);
            }

            // Fallback to calendar month if no rule covers and gap absorption disabled
            return [
                'start_date' => $targetDate->copy()->startOfMonth(),
                'end_date' => $targetDate->copy()->endOfMonth(),
                'label' => $targetDate->format('M Y').' (uncovered)',
                'rule_id' => null,
                'is_first_cycle' => false,
                'has_gap_prefix' => false,
                'gap_start_date' => null,
            ];
        }

        $ruleIndex = $rules->search(fn ($r) => $r->id === $rule->id);
        $prevRule = $ruleIndex > 0 ? $rules->get($ruleIndex - 1) : null;
        $gapExists = $prevRule !== null
            && $prevRule->effective_to !== null
            && $prevRule->effective_to->copy()->addDay()->lt($rule->effective_from);

        $earliestStart = ($gapExists && $rule->include_gap_in_current && $prevRule)
            ? $prevRule->effective_to->copy()->addDay()
            : $rule->effective_from->copy();

        $cycleStart = $this->findCycleStart($targetDate, $rule, $earliestStart);
        $cycleEnd = $this->findCycleEnd($cycleStart, $rule, $rules);

        $isFirstCycle = $cycleStart->eq($rule->effective_from)
            || ($gapExists && $rule->include_gap_in_current);

        return [
            'start_date' => $cycleStart,
            'end_date' => $cycleEnd,
            'label' => $this->formatLabel($cycleStart, $cycleEnd),
            'rule_id' => $rule->id,
            'is_first_cycle' => $isFirstCycle,
            'has_gap_prefix' => $gapExists && $rule->include_gap_in_current,
            'gap_start_date' => ($gapExists && $rule->include_gap_in_current && $prevRule)
                ? $prevRule->effective_to->copy()->addDay()
                : null,
        ];
    }

    /**
     * Derive all op_months from the earliest rule up to $upTo date.
     *
     * @return array<int, array<string, mixed>>
     */
    public function deriveAllOpMonths(Carbon $upTo): array
    {
        /** @var Collection<int, MonthlyCycleRule> $rules */
        $rules = MonthlyCycleRule::query()->orderBy('effective_from')->get();

        if ($rules->isEmpty()) {
            return [];
        }

        $opMonths = [];
        $cursor = $rules->first()->effective_from->copy();

        // Safety: avoid infinite loops (max 120 iterations = 10 years)
        $maxIterations = 120;
        $iterations = 0;

        while ($cursor->lte($upTo) && $iterations < $maxIterations) {
            $opMonth = $this->resolveOpMonth($cursor);
            $opMonths[] = $opMonth;

            // Advance cursor to the day after the current cycle ends
            $cursor = $opMonth['end_date']->copy()->addDay();
            $iterations++;
        }

        return $opMonths;
    }

    /**
     * Get the currently active (in-progress) op_month.
     *
     * @return array<string, mixed>
     */
    public function getCurrentOpMonth(): array
    {
        return $this->resolveOpMonth(Carbon::today());
    }

    /**
     * Get the most recently completed op_month (ended before today).
     *
     * @return array<string, mixed>|null
     */
    public function getLastCompletedOpMonth(): ?array
    {
        $today = Carbon::today();
        $current = $this->getCurrentOpMonth();

        // The previous op_month ends the day before the current one starts
        $prevEnd = $current['start_date']->copy()->subDay();

        if ($prevEnd->lt($this->getEarliestRuleStart())) {
            return null;
        }

        return $this->resolveOpMonth($prevEnd);
    }

    /**
     * Get the active MonthlyCycleRule for a given date.
     */
    public function getActiveRule(?Carbon $date = null): ?MonthlyCycleRule
    {
        $date ??= Carbon::today();

        return MonthlyCycleRule::query()
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            })
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    /**
     * Find the start of the cycle containing $targetDate under the given $rule.
     * Never returns a date before $earliestStart.
     */
    private function findCycleStart(
        Carbon $targetDate,
        MonthlyCycleRule $rule,
        Carbon $earliestStart
    ): Carbon {
        $d = $rule->month_starts_on;

        // Candidate: day $d of the same month as targetDate
        $candidate = $this->setDayOfMonth($targetDate->copy(), $d);

        // If candidate is after targetDate, go back one month
        if ($candidate->gt($targetDate)) {
            $candidate = $this->setDayOfMonth($targetDate->copy()->subMonth(), $d);
        }

        // Never go before the earliest allowed start
        if ($candidate->lt($earliestStart)) {
            return $earliestStart->copy();
        }

        return $candidate;
    }

    /**
     * Find the end of the cycle that starts at $cycleStart.
     * Ends the day before the next cycle, capped at rule's effective_to.
     */
    private function findCycleEnd(
        Carbon $cycleStart,
        MonthlyCycleRule $rule,
        Collection $rules
    ): Carbon {
        $d = $rule->month_starts_on;

        // Next cycle starts exactly one month after the anchor day
        $anchorDate = $this->setDayOfMonth($cycleStart->copy(), $d);

        // If cycleStart is before the anchor (first cycle started early due to effective_from/gap),
        // the anchor is the day $d of cycleStart's month
        if ($cycleStart->lt($anchorDate)) {
            $nextCycleStart = $anchorDate->copy();
        } else {
            $nextCycleStart = $this->setDayOfMonth($cycleStart->copy()->addMonth(), $d);
        }

        // Cap at rule's effective_to
        if ($rule->effective_to !== null && $nextCycleStart->gt($rule->effective_to->copy()->addDay())) {
            return $rule->effective_to->copy();
        }

        // Cap at next rule's effective_from - 1 day
        $ruleIndex = $rules->search(fn ($r) => $r->id === $rule->id);
        $nextRule = $rules->get($ruleIndex + 1);

        if ($nextRule && $nextCycleStart->gte($nextRule->effective_from)) {
            return $nextRule->effective_from->copy()->subDay();
        }

        return $nextCycleStart->copy()->subDay();
    }

    /**
     * Build the first cycle of a rule (used when a gap is absorbed).
     *
     * @param  Collection<int, MonthlyCycleRule>  $rules
     * @return array<string, mixed>
     */
    private function buildFirstCycle(MonthlyCycleRule $rule, Collection $rules): array
    {
        $ruleIndex = $rules->search(fn ($r) => $r->id === $rule->id);
        $prevRule = $ruleIndex > 0 ? $rules->get($ruleIndex - 1) : null;

        $gapExists = $prevRule !== null && $prevRule->effective_to !== null
            && $prevRule->effective_to->copy()->addDay()->lt($rule->effective_from);

        $earliestStart = ($gapExists && $rule->include_gap_in_current && $prevRule)
            ? $prevRule->effective_to->copy()->addDay()
            : $rule->effective_from->copy();

        $cycleEnd = $this->findCycleEnd($earliestStart, $rule, $rules);

        return [
            'start_date' => $earliestStart,
            'end_date' => $cycleEnd,
            'label' => $this->formatLabel($earliestStart, $cycleEnd),
            'rule_id' => $rule->id,
            'is_first_cycle' => true,
            'has_gap_prefix' => $gapExists && $rule->include_gap_in_current,
            'gap_start_date' => ($gapExists && $rule->include_gap_in_current && $prevRule)
                ? $prevRule->effective_to->copy()->addDay()
                : null,
        ];
    }

    /**
     * Clamp a day-of-month to the actual last day of that month.
     * e.g. month_starts_on=31 in February → Feb 28/29
     */
    private function setDayOfMonth(Carbon $date, int $day): Carbon
    {
        $maxDay = $date->daysInMonth;

        return $date->day(min($day, $maxDay));
    }

    /**
     * Format a human-readable label for an op_month range.
     */
    private function formatLabel(Carbon $start, Carbon $end): string
    {
        if ($start->year === $end->year) {
            return $start->format('M d').' – '.$end->format('M d, Y');
        }

        return $start->format('M d, Y').' – '.$end->format('M d, Y');
    }

    /**
     * Get the earliest effective_from date across all rules.
     */
    private function getEarliestRuleStart(): Carbon
    {
        $earliest = MonthlyCycleRule::query()->orderBy('effective_from')->value('effective_from');

        return $earliest ? Carbon::parse($earliest) : Carbon::today();
    }
}
