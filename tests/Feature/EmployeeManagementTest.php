<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;
    use WithFaker;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([ValidateUserSession::class]);

        // Create an admin user with super-admin role
        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $this->admin = User::factory()->create([
            'session_id' => session()->getId(),
        ]);
        $this->admin->roles()->attach($role->id);
    }

    public function test_can_list_employees()
    {
        Employee::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'web')->get(route('admin.employees.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/employees/Index')
            ->has('employees.data', 3)
        );
    }

    public function test_can_create_employee_with_code()
    {
        $department = Department::factory()->create();
        $role = Role::create(['name' => 'Staff', 'slug' => 'staff']);

        $employeeData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'code' => 'EMP-1234',
            'phone' => '1234567890',
            'department_id' => $department->id,
            'role_id' => $role->id,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->admin, 'web')->post(route('admin.employees.store'), $employeeData);

        $response->assertRedirect(route('admin.employees.index'));
        $this->assertDatabaseHas('employees', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'code' => 'EMP-1234',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    }

    public function test_can_update_employee_code()
    {
        $employee = Employee::factory()->create(['code' => 'OLD-CODE']);
        $department = Department::factory()->create();

        $updateData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'code' => 'NEW-CODE',
            'phone' => '0987654321',
            'department_id' => $department->id,
        ];

        $response = $this->actingAs($this->admin, 'web')->patch(route('admin.employees.update', $employee), $updateData);

        $response->assertRedirect();
        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'code' => 'NEW-CODE',
            'name' => 'Jane Doe',
        ]);
    }

    public function test_cannot_use_duplicate_employee_code()
    {
        Employee::factory()->create(['code' => 'EMP-001']);
        $employee2 = Employee::factory()->create(['code' => 'EMP-002']);
        $department = Department::factory()->create();

        $updateData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'code' => 'EMP-001', // Duplicate code
            'phone' => '0987654321',
            'department_id' => $department->id,
        ];

        $response = $this->actingAs($this->admin, 'web')->patch(route('admin.employees.update', $employee2), $updateData);

        $response->assertSessionHasErrors('code');
    }
}
