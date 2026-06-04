<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AttendanceEffectService
{
    public function apply(Employee $employee, Carbon|string $startDate, Carbon|string $endDate, string $mode = 'office'): void
    {
        if (! $employee->code) {
            return;
        }

        foreach ($this->datePeriod($startDate, $endDate) as $date) {
            $attendance = Attendance::query()->firstOrNew([
                'employee_id' => $employee->code,
                'attendance_date' => $date,
            ]);

            if ($attendance->exists && ($attendance->punch_in || $attendance->punch_out)) {
                continue;
            }

            $attendance->fill([
                'machine_id' => null,
                'punch_in' => null,
                'punch_out' => null,
                'ip' => null,
                'employee_name' => $employee->name,
                'group_name' => null,
                'is_live' => false,
                'mode' => $mode === 'remote' ? 'remote' : 'office',
            ]);

            $attendance->save();
        }
    }

    public function clear(Employee $employee, Carbon|string $startDate, Carbon|string $endDate): void
    {
        if (! $employee->code) {
            return;
        }

        Attendance::query()
            ->where('employee_id', $employee->code)
            ->whereBetween('attendance_date', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->whereNull('machine_id')
            ->whereNull('punch_in')
            ->whereNull('punch_out')
            ->delete();
    }

    /**
     * @return array<int, string>
     */
    private function datePeriod(Carbon|string $startDate, Carbon|string $endDate): array
    {
        return collect(CarbonPeriod::create(
            Carbon::parse($startDate)->toDateString(),
            Carbon::parse($endDate)->toDateString(),
        ))
            ->map(fn (Carbon $date): string => $date->toDateString())
            ->all();
    }
}
