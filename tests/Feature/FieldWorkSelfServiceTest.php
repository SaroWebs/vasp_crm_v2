<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Employee;
use App\Models\FieldWorkRequest;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FieldWorkSelfServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(VerifyCsrfToken::class);
    }

    private function signInAsInternalEmployee(): Employee
    {
        $employee = Employee::factory()->create();
        $role = Role::firstOrCreate(['slug' => 'support-agent'], [
            'name' => 'Support Agent',
            'guard_name' => 'web',
        ]);

        $employee->user->assignRole($role);
        $this->actingAs($employee->user, 'web');

        return $employee;
    }

    public function test_employee_can_create_list_update_and_cancel_own_field_work_request(): void
    {
        $employee = $this->signInAsInternalEmployee();

        $createResponse = $this->postJson('/api/my/field-work', [
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-11',
            'location' => 'Client site',
            'description' => 'Onsite implementation work',
            'custom_start_time' => '10:00',
            'custom_end_time' => '18:00',
        ]);

        $createResponse->assertCreated()
            ->assertJson([
                'status' => 'success',
                'message' => 'Field work request submitted successfully.',
            ]);

        $requestId = $createResponse->json('data.id');

        $this->assertDatabaseHas('field_work_requests', [
            'id' => $requestId,
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        $this->getJson('/api/my/field-work?month=6&year=2026')
            ->assertOk()
            ->assertJsonPath('data.0.location', 'Client site');

        $this->putJson("/api/my/field-work/{$requestId}", [
            'location' => 'Updated client site',
            'description' => 'Updated onsite implementation work',
        ])
            ->assertOk()
            ->assertJsonPath('data.location', 'Updated client site');

        $this->deleteJson("/api/my/field-work/{$requestId}")
            ->assertOk()
            ->assertJson([
                'status' => 'success',
                'message' => 'Field work request cancelled successfully.',
            ]);

        $this->assertDatabaseHas('field_work_requests', [
            'id' => $requestId,
            'status' => 'cancelled',
        ]);
    }

    public function test_employee_cannot_update_another_employee_field_work_request(): void
    {
        $employee = $this->signInAsInternalEmployee();
        $otherEmployee = Employee::factory()->create();

        $request = FieldWorkRequest::create([
            'employee_id' => $otherEmployee->id,
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-10',
            'location' => 'Other site',
            'status' => 'pending',
            'requested_by_user_id' => $otherEmployee->user_id,
        ]);

        $this->putJson("/api/my/field-work/{$request->id}", [
            'location' => 'Hijacked site',
        ])->assertNotFound();

        $this->assertDatabaseMissing('field_work_requests', [
            'employee_id' => $employee->id,
            'location' => 'Hijacked site',
        ]);
    }
}
