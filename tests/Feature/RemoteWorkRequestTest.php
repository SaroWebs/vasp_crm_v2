<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RemoteWorkRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function signInAsAdmin(): void
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

    public function test_authenticated_user_can_create_remote_work_request(): void
    {
        $this->signInAsAdmin();
        $employee = Employee::factory()->create();

        $response = $this->postJson('/api/remote-work-requests', [
            'employee_id' => $employee->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'reason' => 'Work from home',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('remote_work_requests', [
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_remote_work_request(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->postJson('/api/remote-work-requests', [
            'employee_id' => $employee->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'reason' => 'Work from home',
        ]);

        $response->assertUnauthorized();
    }
}
