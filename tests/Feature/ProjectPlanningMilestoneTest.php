<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectPlanningMilestoneTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_project_pages_and_statistics_use_planning_phases_as_milestones(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);
        ProjectPhase::create([
            'project_id' => $project->id,
            'name' => 'Foundation',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-10',
            'status' => ProjectPhase::STATUS_COMPLETED,
            'progress' => 100,
        ]);
        ProjectPhase::create([
            'project_id' => $project->id,
            'name' => 'Delivery',
            'start_date' => '2026-06-11',
            'end_date' => '2026-06-20',
            'status' => ProjectPhase::STATUS_ACTIVE,
            'progress' => 50,
        ]);

        $this->actingAs($user)
            ->get('/admin/projects')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/projects/index')
                ->where('projects.data.0.phases_count', 2)
            );

        $this->actingAs($user)
            ->get("/admin/projects/{$project->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/projects/show')
                ->has('project.phases', 2)
                ->missing('project.milestones')
            );

        $this->actingAs($user)
            ->getJson("/admin/projects/{$project->id}/statistics")
            ->assertOk()
            ->assertJson([
                'total_planning_milestones' => 2,
                'completed_planning_milestones' => 1,
            ])
            ->assertJsonMissingPath('total_milestones');
    }

    public function test_planning_milestone_can_be_completed(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);
        $phase = ProjectPhase::create([
            'project_id' => $project->id,
            'name' => 'Foundation',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-10',
            'status' => ProjectPhase::STATUS_ACTIVE,
            'progress' => 40,
        ]);

        $this->actingAs($user)
            ->postJson("/admin/projects/{$project->id}/phases/{$phase->id}/complete")
            ->assertOk()
            ->assertJsonPath('phase.status', ProjectPhase::STATUS_COMPLETED)
            ->assertJsonPath('phase.progress', 100);
    }

    public function test_planning_milestone_dates_must_stay_inside_project_dates(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);

        $this->actingAs($user)
            ->postJson("/admin/projects/{$project->id}/phases", [
                'name' => 'Outside project',
                'start_date' => '2026-05-31',
                'end_date' => '2026-07-01',
                'status' => ProjectPhase::STATUS_PENDING,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    public function test_reorder_rejects_a_phase_from_another_project(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);
        $otherProject = $this->createProject($user, 'Other Project');
        $otherPhase = ProjectPhase::create([
            'project_id' => $otherProject->id,
            'name' => 'Other phase',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-10',
            'status' => ProjectPhase::STATUS_PENDING,
        ]);

        $this->actingAs($user)
            ->postJson("/admin/projects/{$project->id}/phases/reorder", [
                'phases' => [
                    ['id' => $otherPhase->id, 'sort_order' => 0],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phases.0.id');
    }

    public function test_old_project_milestone_routes_are_removed(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);

        $this->actingAs($user)
            ->getJson("/admin/projects/{$project->id}/milestones")
            ->assertNotFound();
    }

    public function test_legacy_project_milestones_are_migrated_to_planning_phases(): void
    {
        $user = $this->createProjectManager();
        $project = $this->createProject($user);
        $migration = require database_path('migrations/2026_06_13_132734_migrate_project_milestones_to_project_phases.php');
        $migration->down();

        DB::table('project_milestones')->insert([
            'id' => 500,
            'project_id' => $project->id,
            'name' => 'Legacy delivery',
            'description' => 'Migrated milestone',
            'target_date' => '2026-06-15',
            'completed_date' => null,
            'status' => 'in_progress',
            'type' => 'delivery',
            'progress' => 60,
            'sort_order' => 1,
            'metadata' => json_encode(['source' => 'legacy']),
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ]);
        Permission::firstOrCreate(
            ['slug' => 'project.manage_phases'],
            ['name' => 'Manage Project Phases', 'module' => 'project', 'action' => 'manage_phases']
        );

        $migration->up();

        $this->assertFalse(Schema::hasTable('project_milestones'));
        $this->assertDatabaseMissing('permissions', ['slug' => 'project.manage_milestones']);
        $this->assertDatabaseHas('project_phases', [
            'project_id' => $project->id,
            'name' => 'Legacy delivery',
            'end_date' => '2026-06-15',
            'status' => ProjectPhase::STATUS_ACTIVE,
            'progress' => 60,
        ]);

        $phase = ProjectPhase::query()->where('name', 'Legacy delivery')->firstOrFail();
        $this->assertSame(500, $phase->settings['legacy_project_milestones'][0]['id']);
    }

    private function createProjectManager(): User
    {
        $user = User::factory()->create();
        $role = Role::firstOrCreate(
            ['slug' => 'manager'],
            ['name' => 'Manager', 'guard_name' => 'web', 'level' => 2]
        );
        $user->roles()->syncWithoutDetaching($role);

        foreach (['project.read', 'project.manage_phases'] as $slug) {
            $permission = Permission::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => str($slug)->replace('.', ' ')->title()->toString(),
                    'module' => 'project',
                    'action' => str($slug)->after('.')->toString(),
                ]
            );
            $user->permissions()->syncWithoutDetaching([
                $permission->id => ['granted' => 'granted'],
            ]);
        }

        return $user;
    }

    private function createProject(User $creator, string $name = 'Planning Project'): Project
    {
        return Project::create([
            'name' => $name,
            'status' => Project::STATUS_ACTIVE,
            'priority' => Project::PRIORITY_MEDIUM,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
            'created_by' => $creator->id,
        ]);
    }
}
