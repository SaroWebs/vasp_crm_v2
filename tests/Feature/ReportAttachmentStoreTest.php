<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportAttachmentStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_xlsx_attachments_can_be_uploaded_for_daily_reports(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $report = Report::create([
            'user_id' => $user->id,
            'report_date' => now()->toDateString(),
            'title' => 'Daily Report',
            'description' => 'Work completed today.',
            'status' => 'submitted',
            'total_hours' => 1.5,
        ]);

        $file = UploadedFile::fake()->create(
            'daily-report.xlsx',
            20,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );

        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->postJson("/admin/api/reports/{$report->id}/attachments", [
                'file' => $file,
            ]);

        $response->assertOk();
        $response->assertJsonPath('file_name', 'daily-report.xlsx');

        $this->assertDatabaseHas('report_attachments', [
            'report_id' => $report->id,
            'file_name' => 'daily-report.xlsx',
        ]);

        Storage::disk('public')->assertExists($response->json('file_path'));
    }

    public function test_unsupported_report_attachment_types_are_rejected(): void
    {
        $user = User::factory()->create();
        $report = Report::create([
            'user_id' => $user->id,
            'report_date' => now()->toDateString(),
            'title' => 'Daily Report',
            'description' => 'Work completed today.',
            'status' => 'submitted',
            'total_hours' => 1.5,
        ]);

        $file = UploadedFile::fake()->create('archive.zip', 10, 'application/zip');

        $response = $this->withoutMiddleware()
            ->actingAs($user)
            ->postJson("/admin/api/reports/{$report->id}/attachments", [
                'file' => $file,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('file');

        $this->assertDatabaseMissing('report_attachments', [
            'report_id' => $report->id,
            'file_name' => 'archive.zip',
        ]);
    }
}
