<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateWebhookPassword;
use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Punch;
use App\Models\Role;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AttendancePunchEntryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateWebhookPassword::class);
    }

    private function signInAsAdmin(): void
    {
        $adminRole = Role::firstOrCreate([
            'slug' => 'admin',
        ], [
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);

        $employee = Employee::factory()->create();
        $employee->user->assignRole($adminRole);
        $this->actingAs($employee->user, 'web');
    }

    public function test_punch_entry_creates_punch_and_derived_attendance_segment(): void
    {
        Carbon::setTestNow('2026-05-16 09:00:00');

        $this->signInAsAdmin();
        $employee = Auth::user()->employee;

        $response = $this->postJson('/api/my/attendance/punch', [
            'mode' => 'office',
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Punch-in recorded successfully.',
            ]);

        $this->assertDatabaseHas('punches', [
            'EmployeeId' => $employee->code,
            'MachineId' => null,
            'Ip' => '127.0.0.1',
            'EmployeeName' => $employee->name,
            'Islive' => false,
        ]);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->code,
            'attendance_date' => Carbon::now()->toDateString(),
            'punch_in' => '09:00:00',
            'punch_out' => null,
            'mode' => 'office',
        ]);
    }

    public function test_multiple_punches_generate_multiple_attendance_segments(): void
    {
        $this->signInAsAdmin();
        $employee = Auth::user()->employee;

        Carbon::setTestNow('2026-05-16 09:00:00');
        $this->postJson('/api/my/attendance/punch', ['mode' => 'office'])->assertOk();

        Carbon::setTestNow('2026-05-16 12:00:00');
        $this->postJson('/api/my/attendance/punch', ['mode' => 'office'])->assertOk();

        Carbon::setTestNow('2026-05-16 13:00:00');
        $this->postJson('/api/my/attendance/punch', ['mode' => 'office'])->assertOk();

        Carbon::setTestNow('2026-05-16 18:00:00');
        $this->postJson('/api/my/attendance/punch', ['mode' => 'office'])->assertOk();

        $this->assertDatabaseCount('punches', 4);
        $this->assertDatabaseCount('attendances', 2);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:00:00',
            'punch_out' => '12:00:00',
        ]);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-16',
            'punch_in' => '13:00:00',
            'punch_out' => '18:00:00',
        ]);
    }

    public function test_duplicate_punch_within_one_minute_is_ignored(): void
    {
        $this->signInAsAdmin();
        $employee = Auth::user()->employee;

        Carbon::setTestNow('2026-05-16 09:00:00');
        $this->postJson('/api/my/attendance/punch', ['mode' => 'office'])->assertOk();

        Carbon::setTestNow('2026-05-16 09:00:30');
        $response = $this->postJson('/api/my/attendance/punch', ['mode' => 'office']);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Punch ignored because a nearby punch already exists within one minute.',
            ]);

        $this->assertDatabaseCount('punches', 1);
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'employee_id' => $employee->code,
            'attendance_date' => '2026-05-16',
            'punch_in' => '09:00:00',
            'punch_out' => null,
        ]);
    }

    public function test_live_punch_with_no_active_employee_office_attaches_head_office(): void
    {
        Carbon::setTestNow('2026-05-16 09:00:00');

        $office = Office::create([
            'id' => 1,
            'name' => 'Head Office',
            'whatsapp_number' => '+919999999999',
            'address' => 'Head Office Address',
            'email' => 'headoffice@example.com',
            'phone' => '9999999999',
            'is_active' => true,
        ]);

        $employee = Employee::factory()->create([
            'code' => '12345',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService->expects($this->once())
            ->method('sendWhatsApp')
            ->with($this->equalTo($office->whatsapp_number), $this->stringContains('has punched at'), true)
            ->willReturn(true);

        $this->app->instance(NotificationService::class, $notificationService);

        $payload = [
            [
                'EmployeeId' => $employee->code,
                'PunchTime' => Carbon::now()->toDateTimeString(),
                'Islive' => true,
            ],
        ];

        $response = $this->postJson('/api/upload_punch_data', $payload);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Attendance recorded successfully. 1 punch(es) processed.',
            ]);

        $this->assertDatabaseHas('employee_offices', [
            'employee_id' => $employee->id,
            'office_id' => 1,
            'is_active' => true,
        ]);
    }

    public function test_live_punch_machine_2_uses_generic_message(): void
    {
        Carbon::setTestNow('2026-05-16 09:00:00');

        $office = Office::create([
            'id' => 1,
            'name' => 'Branch Office',
            'whatsapp_number' => '+919999999999',
            'address' => 'Branch Office Address',
            'email' => 'branchoffice@example.com',
            'phone' => '9999999999',
            'is_active' => true,
        ]);

        $employee = Employee::factory()->create([
            'code' => '12345',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService->expects($this->once())
            ->method('sendWhatsApp')
            ->with(
                $this->equalTo($office->whatsapp_number),
                $this->stringContains('has punched at'),
                true
            )
            ->willReturn(true);

        $this->app->instance(NotificationService::class, $notificationService);

        $payload = [
            [
                'EmployeeId' => $employee->code,
                'MachineId' => 2,
                'PunchTime' => Carbon::now()->toDateTimeString(),
                'Islive' => true,
            ],
        ];

        $response = $this->postJson('/api/upload_punch_data', $payload);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Attendance recorded successfully. 1 punch(es) processed.',
            ]);
    }

    public function test_live_punch_machine_3_uses_punched_in_message(): void
    {
        Carbon::setTestNow('2026-05-16 09:00:00');

        $office = Office::create([
            'id' => 1,
            'name' => 'Head Office',
            'whatsapp_number' => '+919999999999',
            'address' => 'Head Office Address',
            'email' => 'headoffice@example.com',
            'phone' => '9999999999',
            'is_active' => true,
        ]);

        $employee = Employee::factory()->create([
            'code' => '12345',
        ]);

        $notificationService = $this->createMock(NotificationService::class);
        $notificationService->expects($this->once())
            ->method('sendWhatsApp')
            ->with(
                $this->equalTo($office->whatsapp_number),
                $this->stringContains('has punched in at'),
                true
            )
            ->willReturn(true);

        $this->app->instance(NotificationService::class, $notificationService);

        $payload = [
            [
                'EmployeeId' => $employee->code,
                'MachineId' => 3,
                'PunchTime' => Carbon::now()->toDateTimeString(),
                'Islive' => true,
            ],
        ];

        $response = $this->postJson('/api/upload_punch_data', $payload);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Attendance recorded successfully. 1 punch(es) processed.',
            ]);
    }

    /** Main office: machine 3 (punch-in) punches twice at start, machine 1 (punch-out) punches once mid-day, then machine 3 punches again at end. */
    public function test_main_office_machines_3_1_create_two_correct_segments(): void
    {
        $employee = Employee::factory()->create(['code' => '1001']);
        $employeeId = $employee->code;

        $ref = new \ReflectionMethod(\App\Http\Controllers\AttendanceController::class, 'syncAttendanceFromPunches');
        $ref->setAccessible(true);

        $date = Carbon::parse('2026-05-16');

        Punch::create([
            'EmployeeId'   => $employeeId,
            'MachineId'    => 3,
            'PunchTime'    => $date->copy()->setTime(9, 0)->toDateTimeString(),
            'Ip'           => '192.168.1.10',
            'EmployeeName' => $employee->name,
            'Islive'       => false,
        ]);
        Punch::create([
            'EmployeeId'   => $employeeId,
            'MachineId'    => 3,
            'PunchTime'    => $date->copy()->setTime(9, 30)->toDateTimeString(),
            'Ip'           => '192.168.1.10',
            'EmployeeName' => $employee->name,
            'Islive'       => false,
        ]);
        Punch::create([
            'EmployeeId'   => $employeeId,
            'MachineId'    => 3,
            'PunchTime'    => $date->copy()->setTime(17, 0)->toDateTimeString(),
            'Ip'           => '192.168.1.10',
            'EmployeeName' => $employee->name,
            'Islive'       => false,
        ]);
        Punch::create([
            'EmployeeId'   => $employeeId,
            'MachineId'    => 3,
            'PunchTime'    => $date->copy()->setTime(17, 15)->toDateTimeString(),
            'Ip'           => '192.168.1.10',
            'EmployeeName' => $employee->name,
            'Islive'       => false,
        ]);
        // machine 1 once mid-day
        Punch::create([
            'EmployeeId'   => $employeeId,
            'MachineId'    => 1,
            'PunchTime'    => $date->copy()->setTime(12, 0)->toDateTimeString(),
            'Ip'           => '192.168.1.20',
            'EmployeeName' => $employee->name,
            'Islive'       => true,
        ]);

        $ref->invoke(new \App\Http\Controllers\AttendanceController, $employeeId, $date, 'office');

        $records = Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', '2026-05-16')
            ->orderBy('punch_in')
            ->get();

        $this->assertCount(2, $records);

        // Segment 1: machine-3 group as punch_in (09:00), machine-1 as punch_out (12:00)
        $this->assertSame('09:00:00', $records[0]->punch_in);
        $this->assertSame('12:00:00', $records[0]->punch_out);
        $this->assertSame(3, $records[0]->machine_id);

        // Segment 2: remaining machine-3 punches → punch_in only (no partner to punch_out)
        $this->assertSame('17:00:00', $records[1]->punch_in);
        $this->assertNull($records[1]->punch_out);
        $this->assertSame(3, $records[1]->machine_id);
    }

    /** Branch office with a single machine (id=2). All 4 punches form one coherent group. */
    public function test_branch_office_machine_2_forms_one_segment(): void
    {
        $employee = Employee::factory()->create(['code' => '1002']);
        $employeeId = $employee->code;

        $ref = new \ReflectionMethod(\App\Http\Controllers\AttendanceController::class, 'syncAttendanceFromPunches');
        $ref->setAccessible(true);

        $date = Carbon::parse('2026-05-16');

        foreach ([9, 12, 13, 18] as $h) {
            Punch::create([
                'EmployeeId'   => $employeeId,
                'MachineId'    => 2,
                'PunchTime'    => $date->copy()->setTime($h, 0)->toDateTimeString(),
                'Ip'           => '10.0.0.5',
                'EmployeeName' => $employee->name,
                'Islive'       => false,
            ]);
        }

        $ref->invoke(new \App\Http\Controllers\AttendanceController, $employeeId, $date, 'office');

        $records = Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', '2026-05-16')
            ->get();

        file_put_contents(sys_get_temp_dir().'/punch_debug.txt', json_encode($records->all(), JSON_PRETTY_PRINT));

        $this->assertCount(1, $records);
        $this->assertSame('09:00:00', $records[0]->punch_in);
        $this->assertSame('18:00:00', $records[0]->punch_out);
        $this->assertSame(2, $records[0]->machine_id);
    }

    /** 3 consecutive punches on the same machine → 1 group, 1 pair (= 1 segment). */
    public function test_three_consecutive_punches_on_single_machine_generates_one_segment(): void
    {
        $employee = Employee::factory()->create(['code' => '1003']);
        $employeeId = $employee->code;

        $ref = new \ReflectionMethod(\App\Http\Controllers\AttendanceController::class, 'syncAttendanceFromPunches');
        $ref->setAccessible(true);

        $date = Carbon::parse('2026-05-16');

        foreach ([9, 13, 17] as $h) {
            Punch::create([
                'EmployeeId'   => $employeeId,
                'MachineId'    => 3,
                'PunchTime'    => $date->copy()->setTime($h, 0)->toDateTimeString(),
                'EmployeeName' => $employee->name,
                'Islive'       => false,
            ]);
        }

        $ref->invoke(new \App\Http\Controllers\AttendanceController, $employeeId, $date, 'office');

        $records = Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', '2026-05-16')
            ->get();

        $this->assertCount(1, $records);
        $this->assertSame('09:00:00', $records[0]->punch_in);
        $this->assertSame('17:00:00', $records[0]->punch_out);
    }

    /** Alternating offices → 4 groups → 2 paired attendance segments. */
    public function test_alternating_office_machines_pair_positionally(): void
    {
        $employee = Employee::factory()->create(['code' => '1004']);
        $employeeId = $employee->code;

        $ref = new \ReflectionMethod(\App\Http\Controllers\AttendanceController::class, 'syncAttendanceFromPunches');
        $ref->setAccessible(true);

        $date = Carbon::parse('2026-05-16');

        // Main office (mach 3) 09:00; branch (mach 2) 12:00;
        // Main office (mach 3) 17:00; branch (mach 2) 18:00
        foreach ([[3, 9], [2, 12], [3, 17], [2, 18]] as [$mid, $h]) {
            Punch::create([
                'EmployeeId'   => $employeeId,
                'MachineId'    => $mid,
                'PunchTime'    => $date->copy()->setTime($h, 0)->toDateTimeString(),
                'EmployeeName' => $employee->name,
                'Islive'       => false,
            ]);
        }

        $ref->invoke(new \App\Http\Controllers\AttendanceController, $employeeId, $date, 'office');

        $records = Attendance::where('employee_id', $employeeId)
            ->where('attendance_date', '2026-05-16')
            ->orderBy('punch_in')
            ->get();

        $this->assertCount(2, $records);

        // Pair (mach3@9) + (mach2@12) → punch_in=09:00, punch_out=12:00, machine_id from Group1 (mach 3)
        $this->assertSame('09:00:00', $records[0]->punch_in);
        $this->assertSame('12:00:00', $records[0]->punch_out);
        $this->assertSame(3, $records[0]->machine_id);

        // Pair (mach3@17) + (mach2@18) → punch_in=17:00, punch_out=18:00
        $this->assertSame('17:00:00', $records[1]->punch_in);
        $this->assertSame('18:00:00', $records[1]->punch_out);
        $this->assertSame(3, $records[1]->machine_id);
    }
}
