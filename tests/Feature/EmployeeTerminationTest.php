<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\EmployeeTermination;
use App\Models\Office;
use App\Models\Role;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EmployeeTerminationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_terminating_an_employee_records_the_change_and_disables_future_assignments(): void
    {
        $admin = $this->actingAsSuperAdmin();
        $employee = Employee::factory()->create();
        $office = $this->createOffice();
        $employee->offices()->attach($office->id, ['is_active' => true]);
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
            'is_active' => true,
        ]);

        $response = $this->from("/admin/employees/{$employee->id}/edit")
            ->patch("/admin/employees/{$employee->id}", $this->employeePayload($employee, $office, [
                'status' => Employee::STATUS_TERMINATED,
                'termination_type' => 'termination',
                'effective_date' => Carbon::today()->toDateString(),
                'reason' => 'Policy violation',
                'notes' => 'Access revoked after the final meeting.',
            ]));

        $response->assertRedirect("/admin/employees/{$employee->id}/edit");
        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'status' => Employee::STATUS_TERMINATED,
        ]);
        $this->assertDatabaseHas('employee_terminations', [
            'employee_id' => $employee->id,
            'status' => Employee::STATUS_TERMINATED,
            'termination_type' => 'termination',
            'reason' => 'Policy violation',
            'created_by_user_id' => $admin->id,
        ]);
        $this->assertSame('inactive', User::withoutGlobalScope('exclude_inactive')->findOrFail($employee->user_id)->status);
        $this->assertFalse($assignment->fresh()->is_active);
        $this->assertSame(Carbon::today()->toDateString(), $assignment->fresh()->effective_to?->toDateString());
        $this->assertFalse((bool) $employee->fresh()->offices()->firstOrFail()->pivot->is_active);
    }

    public function test_reactivating_an_employee_restores_login_and_primary_office(): void
    {
        $this->actingAsSuperAdmin();
        $employee = Employee::factory()->create([
            'status' => Employee::STATUS_INACTIVE,
        ]);
        User::withoutGlobalScope('exclude_inactive')
            ->findOrFail($employee->user_id)
            ->forceFill(['status' => 'inactive'])
            ->save();
        $office = $this->createOffice();
        $employee->offices()->attach($office->id, ['is_active' => false]);
        EmployeeTermination::factory()->create([
            'employee_id' => $employee->id,
            'status' => Employee::STATUS_INACTIVE,
        ]);

        $response = $this->from("/admin/employees/{$employee->id}/edit")
            ->patch("/admin/employees/{$employee->id}", $this->employeePayload($employee, $office));

        $response->assertRedirect("/admin/employees/{$employee->id}/edit");
        $this->assertSame(Employee::STATUS_ACTIVE, $employee->fresh()->status);
        $this->assertSame('active', User::withoutGlobalScope('exclude_inactive')->findOrFail($employee->user_id)->status);
        $this->assertTrue((bool) $employee->fresh()->offices()->firstOrFail()->pivot->is_active);
        $this->assertDatabaseCount('employee_terminations', 1);
    }

    public function test_management_list_keeps_inactive_employees_while_operational_list_excludes_them(): void
    {
        $this->actingAsSuperAdmin();
        $activeEmployee = Employee::factory()->create([
            'name' => 'Active Employee',
            'status' => Employee::STATUS_ACTIVE,
        ]);
        $inactiveEmployee = Employee::factory()->create([
            'name' => 'Inactive Employee',
            'status' => Employee::STATUS_INACTIVE,
        ]);
        $terminatedEmployee = Employee::factory()->create([
            'name' => 'Terminated Employee',
            'status' => Employee::STATUS_TERMINATED,
        ]);

        $this->getJson('/admin/employees?status=inactive')
            ->assertOk()
            ->assertJsonPath('data.0.id', $inactiveEmployee->id)
            ->assertJsonCount(1, 'data');

        $operationalResponse = $this->getJson('/admin/api/employees');
        $operationalResponse->assertOk();
        $employeeIds = collect($operationalResponse->json())->pluck('id');

        $this->assertTrue($employeeIds->contains($activeEmployee->id));
        $this->assertFalse($employeeIds->contains($inactiveEmployee->id));
        $this->assertFalse($employeeIds->contains($terminatedEmployee->id));
    }

    public function test_separation_details_are_required_and_future_effective_dates_are_rejected(): void
    {
        $this->actingAsSuperAdmin();
        $employee = Employee::factory()->create();
        $office = $this->createOffice();
        $employee->offices()->attach($office->id, ['is_active' => true]);

        $response = $this->from("/admin/employees/{$employee->id}/edit")
            ->patch("/admin/employees/{$employee->id}", $this->employeePayload($employee, $office, [
                'status' => Employee::STATUS_TERMINATED,
                'effective_date' => Carbon::tomorrow()->toDateString(),
            ]));

        $response->assertRedirect("/admin/employees/{$employee->id}/edit")
            ->assertSessionHasErrors(['termination_type', 'effective_date', 'reason']);
        $this->assertSame(Employee::STATUS_ACTIVE, $employee->fresh()->status);
    }

    public function test_inactive_employee_cannot_be_assigned_to_a_new_shift_by_api(): void
    {
        $this->actingAsSuperAdmin();
        $employee = Employee::factory()->create([
            'status' => Employee::STATUS_INACTIVE,
        ]);
        $shift = Shift::create([
            'name' => 'Evening Shift',
            'start_time' => '14:00:00',
            'end_time' => '22:00:00',
            'grace_minutes' => 10,
            'is_active' => true,
        ]);

        $this->postJson('/admin/api/shift-assignments', [
            'employee_ids' => [$employee->id],
            'shift_id' => $shift->id,
            'effective_from' => Carbon::today()->toDateString(),
            'is_active' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['employee_ids.0']);

        $this->assertDatabaseCount('employee_shift_assignments', 0);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function employeePayload(Employee $employee, Office $office, array $overrides = []): array
    {
        return array_merge([
            'name' => $employee->name,
            'email' => $employee->email,
            'code' => $employee->code,
            'phone' => $employee->phone,
            'department_id' => $employee->department_id,
            'office_ids' => [$office->id],
            'active_office_id' => $office->id,
            'status' => Employee::STATUS_ACTIVE,
            'termination_type' => null,
            'effective_date' => null,
            'reason' => null,
            'notes' => null,
        ], $overrides);
    }

    private function createOffice(): Office
    {
        return Office::create([
            'name' => 'Head Office',
            'whatsapp_number' => '15551234567',
            'is_active' => true,
        ]);
    }

    private function actingAsSuperAdmin(): User
    {
        $role = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'status' => 'active',
        ]);
        $user->assignRole($role);
        $this->actingAs($user, 'web');

        return $user;
    }
}
