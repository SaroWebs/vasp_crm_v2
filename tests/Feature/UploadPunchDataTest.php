<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UploadPunchDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['webhooks.passwords.attendance' => '123']);
    }

    public function test_upload_punch_data_stores_records(): void
    {
        $response = $this
            ->withHeader('X-Webhook-Password', '123')
            ->postJson('/api/upload_punch_data', [
                [
                    'EmployeeId' => 101,
                    'MachineId' => 1,
                    'PunchTime' => '2026-05-16T09:00:00',
                    'Ip' => '192.168.1.10',
                    'GroupName' => 'Engineering',
                    'EmployeeName' => 'Alice',
                    'Islive' => false,
                ],
                [
                    'EmployeeId' => 102,
                    'PunchTime' => '2026-05-16T09:05:00',
                    'EmployeeName' => 'Bob',
                ],
            ]);

        $response
            ->assertOk()
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseCount('punches', 2);
        $this->assertDatabaseHas('punches', [
            'EmployeeId' => 101,
            'EmployeeName' => 'Alice',
            'GroupName' => 'Engineering',
        ]);
        $this->assertDatabaseHas('punches', [
            'EmployeeId' => 102,
            'EmployeeName' => 'Bob',
            'Islive' => false,
        ]);
    }

    public function test_upload_punch_data_updates_existing_record(): void
    {
        DB::table('punches')->insert([
            'EmployeeId' => 101,
            'PunchTime' => '2026-05-16 09:00:00',
            'EmployeeName' => 'Alice Old',
            'Islive' => false,
        ]);

        $response = $this
            ->withHeader('X-Webhook-Password', '123')
            ->postJson('/api/upload_punch_data', [
                [
                    'EmployeeId' => 101,
                    'PunchTime' => '2026-05-16T09:00:00',
                    'EmployeeName' => 'Alice Updated',
                    'Islive' => true,
                ],
            ]);

        $response->assertOk();

        $this->assertDatabaseCount('punches', 1);
        $this->assertDatabaseHas('punches', [
            'EmployeeId' => 101,
            'EmployeeName' => 'Alice Updated',
            'Islive' => true,
        ]);
    }

    public function test_upload_punch_data_skips_duplicate_within_one_minute(): void
    {
        DB::table('punches')->insert([
            'EmployeeId' => 101,
            'PunchTime' => '2026-05-16 09:00:00',
            'EmployeeName' => 'Alice Existing',
            'Islive' => false,
        ]);

        $response = $this
            ->withHeader('X-Webhook-Password', '123')
            ->postJson('/api/upload_punch_data', [
                [
                    'EmployeeId' => 101,
                    'PunchTime' => '2026-05-16T09:00:30',
                    'EmployeeName' => 'Alice Duplicate',
                    'Islive' => true,
                ],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseCount('punches', 1);
        $this->assertDatabaseHas('punches', [
            'EmployeeId' => 101,
            'EmployeeName' => 'Alice Existing',
            'Islive' => false,
        ]);
    }

    public function test_upload_punch_data_rejects_missing_required_fields(): void
    {
        $response = $this
            ->withHeader('X-Webhook-Password', '123')
            ->postJson('/api/upload_punch_data', [
                [
                    'MachineId' => 1,
                    'Ip' => '192.168.1.10',
                ],
            ]);

        $response->assertUnprocessable();
    }

    public function test_upload_punch_data_fails_without_webhook_password(): void
    {
        $response = $this->postJson('/api/upload_punch_data', [
            [
                'EmployeeId' => 101,
                'PunchTime' => '2026-05-16T09:00:00',
            ],
        ]);

        $response->assertUnauthorized();
    }
}
