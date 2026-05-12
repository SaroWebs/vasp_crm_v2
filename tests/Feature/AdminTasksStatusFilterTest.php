<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTasksStatusFilterTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_maps_status_query_to_state_filter_on_index(): void
    {
        $admin = User::factory()->create();

        $superAdminRole = Role::query()->create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role for tests',
            'is_default' => false,
            'level' => 100,
        ]);

        $admin->roles()->attach($superAdminRole->id);

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $response = $this->actingAs($admin, 'web')->get('/admin/tasks?status=pending');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/tasks/Index')
            ->where('filters.state', 'Draft')
        );
    }

    /** @test */
    public function it_filters_tasks_data_by_status_query(): void
    {
        $admin = User::factory()->create();

        $superAdminRole = Role::query()->create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role for tests',
            'is_default' => false,
            'level' => 100,
        ]);

        $admin->roles()->attach($superAdminRole->id);

        Task::factory()->create(['state' => 'Draft']);
        Task::factory()->create(['state' => 'Done']);

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $response = $this->actingAs($admin, 'web')->getJson('/admin/data/tasks?status=pending&per_page=100');

        $response->assertOk();
        $this->assertNotEmpty($response->json('tasks.data'));
        $this->assertSame(['Draft'], collect($response->json('tasks.data'))->pluck('state')->unique()->values()->all());
    }
}
