<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Role;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ShiftAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_night_shift_can_be_created_with_end_time_before_start_time(): void
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateUserSession::class);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/admin/api/shifts', [
            'name' => 'Night Shift',
            'start_time' => '19:00',
            'end_time' => '03:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Shift created successfully.',
            ]);

        $this->assertDatabaseHas('shifts', [
            'name' => 'Night Shift',
            'start_time' => '19:00:00',
            'end_time' => '03:00:00',
        ]);
    }

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
        $this->withoutMiddleware(ValidateUserSession::class);
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
            ]);

            $closedAssignment = EmployeeShiftAssignment::query()
                ->where('employee_id', $employee->id)
                ->where('shift_id', $shiftA->id)
                ->firstOrFail();
            $this->assertSame(
                Carbon::today()->subDay()->toDateString(),
                $closedAssignment->effective_to?->toDateString(),
            );
        }
    }

    public function test_admin_can_fetch_an_employees_current_shift_and_assignment_history(): void
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateUserSession::class);
        $this->actingAs($user, 'web');

        $employee = Employee::factory()->create();
        $previousShift = Shift::create([
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);
        $currentShift = Shift::create([
            'name' => 'Evening Shift',
            'start_time' => '14:00:00',
            'end_time' => '22:00:00',
            'grace_minutes' => 5,
            'is_active' => true,
        ]);

        EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $previousShift->id,
            'effective_from' => Carbon::today()->subMonth()->toDateString(),
            'effective_to' => Carbon::today()->subDay()->toDateString(),
            'is_active' => false,
        ]);
        $currentAssignment = EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $currentShift->id,
            'effective_from' => Carbon::today()->toDateString(),
            'effective_to' => null,
            'is_active' => true,
        ]);

        $this->getJson("/admin/api/employees/{$employee->id}/shift-assignments")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $currentAssignment->id)
            ->assertJsonPath('data.0.shift.name', 'Evening Shift')
            ->assertJsonPath('data.0.employee_id', $employee->id);
    }

    public function test_admin_can_edit_and_deactivate_an_expired_shift_assignment(): void
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
        ]);
        $user = User::factory()->create();
        $user->assignRole($role);

        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->withoutMiddleware(ValidateUserSession::class);
        $this->actingAs($user, 'web');

        $employee = Employee::factory()->create();
        $shift = Shift::create([
            'name' => 'Morning Shift',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);
        $assignment = EmployeeShiftAssignment::create([
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => Carbon::today()->subMonth()->toDateString(),
            'effective_to' => null,
            'is_active' => true,
        ]);

        $effectiveTo = Carbon::today()->subDay()->toDateString();

        $this->patchJson("/admin/api/shift-assignments/{$assignment->id}", [
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'effective_from' => Carbon::today()->subMonth()->toDateString(),
            'effective_to' => $effectiveTo,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('employee_shift_assignments', [
            'id' => $assignment->id,
            'effective_to' => Carbon::parse($effectiveTo)->startOfDay(),
            'is_active' => false,
        ]);
    }
}
