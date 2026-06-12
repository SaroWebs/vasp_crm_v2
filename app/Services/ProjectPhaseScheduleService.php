<?php

namespace App\Services;

use App\Models\ProjectPhase;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class ProjectPhaseScheduleService
{
    public function validate(ProjectPhase $phase, ?string $startAt, ?string $dueAt): void
    {
        $errors = [];
        $phaseStart = $phase->start_date?->copy()->startOfDay();
        $phaseEnd = $phase->end_date?->copy()->endOfDay();
        $taskStart = $startAt ? Carbon::parse($startAt) : null;
        $taskDue = $dueAt ? Carbon::parse($dueAt) : null;

        if (! $phaseStart || ! $phaseEnd) {
            $errors['phase_id'] = sprintf(
                'Set both the start and end dates for the %s phase before creating tasks in it.',
                $phase->name
            );
        }

        if ($taskStart && $phaseStart && $taskStart->lessThan($phaseStart)) {
            $errors['start_at'] = sprintf(
                'The task start date and time must be on or after the %s phase starts on %s.',
                $phase->name,
                $phaseStart->format('M j, Y')
            );
        }

        if ($taskStart && $phaseEnd && $taskStart->greaterThan($phaseEnd)) {
            $errors['start_at'] = sprintf(
                'The task start date and time must be on or before the %s phase ends on %s.',
                $phase->name,
                $phaseEnd->format('M j, Y')
            );
        }

        if ($taskDue && $phaseStart && $taskDue->lessThan($phaseStart)) {
            $errors['due_at'] = sprintf(
                'The task due date and time must be on or after the %s phase starts on %s.',
                $phase->name,
                $phaseStart->format('M j, Y')
            );
        }

        if ($taskDue && $phaseEnd && $taskDue->greaterThan($phaseEnd)) {
            $errors['due_at'] = sprintf(
                'The task due date and time must be on or before the %s phase ends on %s.',
                $phase->name,
                $phaseEnd->format('M j, Y')
            );
        }

        if ($taskStart && $taskDue && $taskDue->lessThan($taskStart)) {
            $errors['due_at'] = 'The task due date and time must be after the task start date and time.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
