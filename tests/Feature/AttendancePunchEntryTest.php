<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Employee;
use App\Models\Role;
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
}
