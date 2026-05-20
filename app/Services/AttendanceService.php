<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Punch;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    public function syncAttendanceFromPunches(string $employeeId, Carbon $punchDate, string $mode = 'office'): void
    {
        $attendanceDate = $punchDate->toDateString();
        $punches = Punch::where('EmployeeId', $employeeId)
            ->whereDate('PunchTime', $attendanceDate)
            ->orderBy('PunchTime')
            ->get();

        Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', $attendanceDate)
            ->delete();

        if ($punches->isEmpty()) {
            return;
        }

        $segments = $punches->pluck('MachineId')->unique()->count() <= 1
            ? $this->buildSingleMachineAttendanceSegments($punches, $employeeId, $attendanceDate, $mode)
            : $this->buildMultiMachineAttendanceSegments($punches, $employeeId, $attendanceDate, $mode);

        Attendance::insert($segments);
    }

    private function buildSingleMachineAttendanceSegments(Collection $punches, string $employeeId, string $attendanceDate, string $mode): array
    {
        $firstPunch = $punches->first();
        $lastPunch = $punches->last();
        $now = Carbon::now();

        return [[
            'employee_id' => $employeeId,
            'machine_id' => $firstPunch->MachineId,
            'attendance_date' => $attendanceDate,
            'punch_in' => $firstPunch->PunchTime->format('H:i:s'),
            'punch_out' => $punches->count() > 1 ? $lastPunch->PunchTime->format('H:i:s') : null,
            'ip' => $firstPunch->Ip,
            'employee_name' => $firstPunch->EmployeeName,
            'group_name' => $firstPunch->GroupName,
            'is_live' => $firstPunch->Islive ? 1 : 0,
            'mode' => $mode,
            'created_at' => $now,
            'updated_at' => $now,
        ]];
    }

    private function buildMultiMachineAttendanceSegments(Collection $punches, string $employeeId, string $attendanceDate, string $mode): array
    {
        $machineGroups = [];

        foreach ($punches as $punch) {
            $machineId = $punch->MachineId;
            $groupCount = count($machineGroups);

            if ($groupCount === 0 || $machineGroups[$groupCount - 1]['machine_id'] !== $machineId) {
                $machineGroups[] = [
                    'machine_id' => $machineId,
                    'punches' => [$punch],
                ];
            } else {
                $machineGroups[$groupCount - 1]['punches'][] = $punch;
            }
        }

        $now = Carbon::now();
        $segments = [];

        for ($i = 0; $i < count($machineGroups); $i += 2) {
            $firstGroup = $machineGroups[$i];
            $firstPunch = $firstGroup['punches'][0];

            $segment = [
                'employee_id' => $employeeId,
                'machine_id' => $firstPunch->MachineId,
                'attendance_date' => $attendanceDate,
                'punch_in' => $firstPunch->PunchTime->format('H:i:s'),
                'punch_out' => null,
                'ip' => $firstPunch->Ip,
                'employee_name' => $firstPunch->EmployeeName,
                'group_name' => $firstPunch->GroupName,
                'is_live' => $firstPunch->Islive ? 1 : 0,
                'mode' => $mode,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($i + 1 < count($machineGroups)) {
                $secondGroup = $machineGroups[$i + 1];
                $lastPunch = end($secondGroup['punches']);

                $segment['punch_out'] = $lastPunch->PunchTime->format('H:i:s');

                if ($lastPunch->Ip) {
                    $segment['ip'] = $lastPunch->Ip;
                }
                if ($lastPunch->Islive) {
                    $segment['is_live'] = 1;
                }
            }

            $segments[] = $segment;
        }

        return $segments;
    }
}
