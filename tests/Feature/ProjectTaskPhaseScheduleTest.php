<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTaskPhaseScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_task_can_be_created_inside_the_selected_phase_schedule(): void
    {
        [$user, $project, $phase] = $this->createProjectSchedule();

        $response = $this->actingAs($user)->postJson('/admin/tasks', [
            'title' => 'Build project foundation',
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'start_at' => '2026-06-10 09:00:00',
            'due_at' => '2026-06-12 17:00:00',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('tasks', [
            'title' => 'Build project foundation',
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'start_at' => '2026-06-10 09:00:00',
            'due_at' => '2026-06-12 17:00:00',
        ]);
    }

    public function test_task_start_cannot_be_before_the_selected_phase(): void
    {
        [$user, $project, $phase] = $this->createProjectSchedule();

        $response = $this->actingAs($user)->postJson('/admin/tasks', [
            'title' => 'Early project task',
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'start_at' => '2026-06-09 23:59:00',
            'due_at' => '2026-06-11 12:00:00',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('start_at');
        $this->assertDatabaseMissing('tasks', ['title' => 'Early project task']);
    }

    public function test_task_due_date_cannot_be_after_the_selected_phase(): void
    {
        [$user, $project, $phase] = $this->createProjectSchedule();

        $response = $this->actingAs($user)->postJson('/admin/tasks', [
            'title' => 'Late project task',
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'start_at' => '2026-06-19 09:00:00',
            'due_at' => '2026-06-21 00:00:00',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('due_at');
        $this->assertDatabaseMissing('tasks', ['title' => 'Late project task']);
    }

    public function test_task_cannot_be_scheduled_in_a_phase_without_both_dates(): void
    {
        [$user, $project, $phase] = $this->createProjectSchedule();
        $phase->update(['end_date' => null]);

        $response = $this->actingAs($user)->postJson('/admin/tasks', [
            'title' => 'Task without phase boundary',
            'project_id' => $project->id,
            'phase_id' => $phase->id,
            'start_at' => '2026-06-10 09:00:00',
            'due_at' => '2026-06-12 17:00:00',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('phase_id');
        $this->assertDatabaseMissing('tasks', ['title' => 'Task without phase boundary']);
    }

    /**
     * @return array{User, Project, ProjectPhase}
     */
    private function createProjectSchedule(): array
    {
        $user = User::factory()->create();
        $role = Role::create([
            'name' => 'Manager',
            'slug' => 'manager',
            'guard_name' => 'web',
            'level' => 2,
        ]);
        $permission = Permission::create([
            'name' => 'Create Tasks',
            'slug' => 'task.create',
            'module' => 'task',
            'action' => 'create',
        ]);
        $user->roles()->attach($role);
        $user->permissions()->attach($permission, ['granted' => 'granted']);

        $project = Project::create([
            'name' => 'Scheduled Project',
            'status' => Project::STATUS_ACTIVE,
            'priority' => Project::PRIORITY_MEDIUM,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
            'created_by' => $user->id,
        ]);
        $phase = ProjectPhase::create([
            'project_id' => $project->id,
            'name' => 'Foundation',
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-20',
            'status' => ProjectPhase::STATUS_ACTIVE,
        ]);

        return [$user, $project, $phase];
    }
}
