<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TimelineEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimelineMilestoneDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_a_task_milestone(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $admin = $this->createAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MILESTONE-001',
            'title' => 'Milestone Delete Task',
            'state' => 'Draft',
            'created_by' => $admin->id,
        ]);

        $milestone = TimelineEvent::query()->create([
            'task_id' => $task->id,
            'user_id' => $admin->id,
            'event_type' => 'milestone',
            'event_name' => 'Delete Me',
            'event_description' => 'Milestone for delete test',
            'event_date' => now(),
            'is_milestone' => true,
            'milestone_type' => 'checkpoint',
            'target_date' => now()->addHour(),
            'is_completed' => false,
            'progress_percentage' => 0,
        ]);

        $this->actingAs($admin, 'web')
            ->deleteJson("/timeline-events/{$milestone->id}/milestone")
            ->assertOk()
            ->assertJsonPath('message', 'Milestone deleted successfully');

        $this->assertSoftDeleted('timeline_events', [
            'id' => $milestone->id,
        ]);
    }

    public function test_delete_milestone_endpoint_rejects_non_milestone_events(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $admin = $this->createAdminUser();
        $task = Task::query()->create([
            'task_code' => 'TASK-MILESTONE-002',
            'title' => 'Non Milestone Delete Task',
            'state' => 'Draft',
            'created_by' => $admin->id,
        ]);

        $event = TimelineEvent::query()->create([
            'task_id' => $task->id,
            'user_id' => $admin->id,
            'event_type' => 'daily_report',
            'event_name' => 'Not Milestone',
            'event_description' => 'Non milestone event',
            'event_date' => now(),
            'is_milestone' => false,
        ]);

        $this->actingAs($admin, 'web')
            ->deleteJson("/timeline-events/{$event->id}/milestone")
            ->assertStatus(400)
            ->assertJsonPath('error', 'This is not a milestone');
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
