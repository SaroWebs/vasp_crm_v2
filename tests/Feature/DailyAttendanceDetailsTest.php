<?php

namespace Tests\Feature;

use App\Http\Controllers\AttendanceController;
use App\Models\Employee;
use App\Models\Punch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class DailyAttendanceDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_daily_details_returns_attendance_summary_for_requested_date(): void
    {
        $employee = Employee::factory()->create([
            'name' => 'Alice Example',
            'code' => '1001',
        ]);

        Punch::create([
            'EmployeeId' => $employee->code,
            'MachineId' => 1,
            'PunchTime' => '2026-05-01 09:00:00',
            'Ip' => '127.0.0.1',
            'GroupName' => 'Engineering',
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        Punch::create([
            'EmployeeId' => $employee->code,
            'MachineId' => 1,
            'PunchTime' => '2026-05-01 17:00:00',
            'Ip' => '127.0.0.1',
            'GroupName' => 'Engineering',
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        $controller = new AttendanceController;
        $request = Request::create('/api/daily/attendance', 'GET', ['date' => '2026-05-01']);

        $response = $controller->getDailyDetails($request);

        $this->assertSame(200, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);

        $this->assertSame('2026-05-01', $payload['date']);
        $this->assertCount(1, $payload['records']);

        $record = $payload['records'][0];

        $this->assertSame('Alice Example', $record['employee_name']);
        $this->assertSame('1001', $record['employee_id']);
        $this->assertSame('2026-05-01 09:00:00', $record['punch_in']);
        $this->assertSame('2026-05-01 17:00:00', $record['punch_out']);
        $this->assertSame(0, $record['total_break_minutes']);
        $this->assertSame(480, $record['total_work_minutes']);
    }
}
