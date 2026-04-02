<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TimelineEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimelineMilestoneUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_a_task_milestone(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $admin = $this->createAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MILESTONE-UPDATE-001',
            'title' => 'Milestone Update Task',
            'state' => 'Draft',
            'created_by' => $admin->id,
        ]);

        $milestone = TimelineEvent::query()->create([
            'task_id' => $task->id,
            'user_id' => $admin->id,
            'event_type' => 'milestone',
            'event_name' => 'Initial Milestone',
            'event_description' => 'Milestone before update',
            'event_date' => now()->startOfHour()->format('Y-m-d H:i:s'),
            'is_milestone' => true,
            'milestone_type' => 'checkpoint',
            'target_date' => now()->startOfHour()->addMinutes(30)->format('Y-m-d H:i:s'),
            'is_completed' => false,
            'progress_percentage' => 25,
        ]);

        $updatedEventDate = now()->startOfHour()->addHour()->format('Y-m-d H:i:s');
        $updatedTargetDate = now()->startOfHour()->addHours(2)->format('Y-m-d H:i:s');

        $this->actingAs($admin, 'web')
            ->patchJson("/timeline-events/{$milestone->id}/milestone", [
                'event_name' => 'Updated Milestone',
                'event_description' => 'Updated milestone description',
                'event_date' => $updatedEventDate,
                'milestone_type' => 'completion',
                'target_date' => $updatedTargetDate,
                'progress_percentage' => 80,
            ])
            ->assertOk()
            ->assertJsonPath('event_name', 'Updated Milestone')
            ->assertJsonPath('milestone_type', 'completion')
            ->assertJsonPath('progress_percentage', 80)
            ->assertJsonPath('task.id', $task->id);

        $this->assertDatabaseHas('timeline_events', [
            'id' => $milestone->id,
            'event_name' => 'Updated Milestone',
            'event_description' => 'Updated milestone description',
            'milestone_type' => 'completion',
            'progress_percentage' => 80,
            'event_date' => $updatedEventDate,
            'target_date' => $updatedTargetDate,
        ]);
    }

    private function createAdminUser(): User
    {
        $role = Role::query()->create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
