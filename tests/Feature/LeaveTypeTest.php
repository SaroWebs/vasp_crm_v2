<?php

namespace Tests\Feature;

use App\Models\LeaveType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveTypeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test listing all leave types
     */
    public function test_can_list_leave_types(): void
    {
        LeaveType::factory()->count(3)->create();

        $response = $this->getJson('/api/leave-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total',
                'leave_types' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'duration_type',
                        'default_hours',
                        'requires_approval',
                        'is_paid',
                        'carry_over_allowed',
                        'is_active',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        $this->assertEquals(3, $response->json('total'));
    }

    /**
     * Test listing only active leave types
     */
    public function test_can_list_active_leave_types_only(): void
    {
        LeaveType::factory()->create(['is_active' => true]);
        LeaveType::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/leave-types?active_only=true');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
        $this->assertTrue($response->json('leave_types.0.is_active'));
    }

    /**
     * Test creating a leave type
     */
    public function test_can_create_leave_type(): void
    {
        $data = [
            'name' => 'Annual Leave',
            'description' => 'Annual paid leave',
            'duration_type' => 'full_day',
            'default_hours' => 8,
            'requires_approval' => true,
            'is_paid' => true,
            'carry_over_allowed' => false,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/leave-types', $data);

        $response->assertStatus(201)
            ->assertJsonFragment($data);

        $this->assertDatabaseHas('leave_types', $data);
    }

    /**
     * Test creating a leave type with minimum required fields
     */
    public function test_can_create_leave_type_with_minimum_fields(): void
    {
        $data = [
            'name' => 'Sick Leave',
            'duration_type' => 'full_day',
        ];

        $response = $this->postJson('/api/leave-types', $data);

        $response->assertStatus(201);

        $this->assertDatabaseHas('leave_types', ['name' => 'Sick Leave']);
    }

    /**
     * Test creating a leave type with duplicate name fails
     */
    public function test_cannot_create_leave_type_with_duplicate_name(): void
    {
        LeaveType::factory()->create(['name' => 'Annual Leave']);

        $data = [
            'name' => 'Annual Leave',
            'duration_type' => 'full_day',
        ];

        $response = $this->postJson('/api/leave-types', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    /**
     * Test creating a leave type without required fields fails
     */
    public function test_cannot_create_leave_type_without_required_fields(): void
    {
        $data = [
            'description' => 'Some description',
        ];

        $response = $this->postJson('/api/leave-types', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'duration_type']);
    }

    /**
     * Test getting a specific leave type
     */
    public function test_can_get_specific_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $response = $this->getJson("/api/leave-types/{$leaveType->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $leaveType->id,
                'name' => $leaveType->name,
            ]);
    }

    /**
     * Test getting a non-existent leave type returns 404
     */
    public function test_cannot_get_nonexistent_leave_type(): void
    {
        $response = $this->getJson('/api/leave-types/999');

        $response->assertStatus(404);
    }

    /**
     * Test updating a leave type
     */
    public function test_can_update_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'is_paid' => true,
        ]);

        $updateData = [
            'name' => 'Annual Leave Updated',
            'description' => 'Updated description',
            'is_paid' => false,
        ];

        $response = $this->putJson("/api/leave-types/{$leaveType->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment($updateData);

        $this->assertDatabaseHas('leave_types', $updateData);
    }

    /**
     * Test updating a leave type with duplicate name (of another type) fails
     */
    public function test_cannot_update_leave_type_to_duplicate_name(): void
    {
        $leaveType1 = LeaveType::factory()->create(['name' => 'Annual Leave']);
        $leaveType2 = LeaveType::factory()->create(['name' => 'Sick Leave']);

        $response = $this->putJson("/api/leave-types/{$leaveType2->id}", [
            'name' => 'Annual Leave',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    /**
     * Test updating a leave type with invalid duration type fails
     */
    public function test_cannot_update_leave_type_with_invalid_duration_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $response = $this->putJson("/api/leave-types/{$leaveType->id}", [
            'duration_type' => 'invalid_type',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('duration_type');
    }

    /**
     * Test deleting a leave type
     */
    public function test_can_delete_leave_type(): void
    {
        $leaveType = LeaveType::factory()->create();

        $response = $this->deleteJson("/api/leave-types/{$leaveType->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Leave type deleted successfully.']);

        $this->assertDatabaseMissing('leave_types', ['id' => $leaveType->id]);
    }

    /**
     * Test cannot delete a leave type with existing leave requests
     */
    public function test_cannot_delete_leave_type_with_leave_requests(): void
    {
        $leaveType = LeaveType::factory()->has('leaveRequests')->create();

        $response = $this->deleteJson("/api/leave-types/{$leaveType->id}");

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Cannot delete leave type with existing leave requests.']);

        $this->assertDatabaseHas('leave_types', ['id' => $leaveType->id]);
    }

    /**
     * Test invalid default hours validation
     */
    public function test_cannot_create_leave_type_with_invalid_default_hours(): void
    {
        $data = [
            'name' => 'Test Leave',
            'duration_type' => 'full_day',
            'default_hours' => 25, // Invalid: more than 24 hours
        ];

        $response = $this->postJson('/api/leave-types', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('default_hours');
    }

    /**
     * Test creating leave types with different duration types
     */
    public function test_can_create_leave_types_with_different_duration_types(): void
    {
        $durationTypes = ['full_day', 'half_day', 'custom_hours', 'hourly'];

        foreach ($durationTypes as $type) {
            $response = $this->postJson('/api/leave-types', [
                'name' => "Leave Type - {$type}",
                'duration_type' => $type,
            ]);

            $response->assertStatus(201);
        }

        $this->assertDatabaseCount('leave_types', count($durationTypes));
    }
}
