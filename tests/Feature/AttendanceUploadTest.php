<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_punch_sets_punch_in_and_out(): void
    {
        $payload = [
            'EmployeeId' => 101,
            'MachineId' => 'M001',
            'PunchTime' => '2026-04-29 09:00:00',
            'Ip' => '192.168.1.1',
            'GroupName' => 'IT',
            'EmployeeName' => 'John Doe',
            'Islive' => true,
        ];

        $response = $this->postJson('/api/upload_punch_data', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', null);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => 101,
            'attendance_date' => '2026-04-29',
            'punch_in' => '09:00:00',
            'punch_out' => null,
        ]);
    }

    public function test_subsequent_punches_update_punch_out(): void
    {
        // First punch
        $this->postJson('/api/upload_punch_data', [
            'EmployeeId' => 101,
            'MachineId' => 'M001',
            'PunchTime' => '2026-04-29 09:00:00',
        ]);

        // Second punch
        $response = $this->postJson('/api/upload_punch_data', [
            'EmployeeId' => 101,
            'MachineId' => 'M001',
            'PunchTime' => '2026-04-29 13:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', '13:00:00');

        // Third punch
        $response = $this->postJson('/api/upload_punch_data', [
            'EmployeeId' => 101,
            'MachineId' => 'M001',
            'PunchTime' => '2026-04-29 18:00:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.punch_in', '09:00:00')
            ->assertJsonPath('data.punch_out', '18:00:00');

        $this->assertDatabaseHas('attendances', [
            'employee_id' => 101,
            'attendance_date' => '2026-04-29',
            'punch_in' => '09:00:00',
            'punch_out' => '18:00:00',
        ]);
    }
}
