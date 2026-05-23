<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Role;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ShiftAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_multiple_employees_can_be_assigned_to_the_same_shift_and_previous_active_assignments_are_closed(): void
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->actingAs($user, 'web');

        $shiftA = Shift::create([
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        $shiftB = Shift::create([
            'name' => 'Evening Shift',
            'start_time' => '14:00:00',
            'end_time' => '22:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        $employees = Employee::factory()->count(2)->create();

        foreach ($employees as $employee) {
            EmployeeShiftAssignment::create([
                'employee_id' => $employee->id,
                'shift_id' => $shiftA->id,
                'effective_from' => Carbon::today()->subDays(7)->toDateString(),
                'effective_to' => null,
                'is_active' => true,
            ]);
        }

        $response = $this->postJson('/admin/api/shift-assignments', [
            'employee_ids' => $employees->pluck('id')->all(),
            'shift_id' => $shiftB->id,
            'effective_from' => Carbon::today()->toDateString(),
            'effective_to' => null,
            'is_active' => true,
        ]);

        $response->assertStatus(200)->assertJson(['status' => 'success']);

        foreach ($employees as $employee) {
            $this->assertDatabaseHas('employee_shift_assignments', [
                'employee_id' => $employee->id,
                'shift_id' => $shiftB->id,
                'is_active' => true,
            ]);

            $this->assertDatabaseHas('employee_shift_assignments', [
                'employee_id' => $employee->id,
                'shift_id' => $shiftA->id,
                'is_active' => false,
                'effective_to' => Carbon::today()->subDay()->toDateString(),
            ]);
        }
    }
}
