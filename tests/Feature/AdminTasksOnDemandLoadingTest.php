<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTasksOnDemandLoadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_index_does_not_include_server_rendered_tasks_payload(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        $this->actingAs($admin, 'web')
            ->get('/admin/tasks')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/tasks/Index')
                ->missing('tasks')
                ->has('filters')
                ->has('users')
                ->has('departments')
            );
    }

    public function test_tasks_data_endpoint_returns_paginated_task_data_on_demand(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        Task::query()->create([
            'title' => 'First on-demand task',
            'task_code' => 'TASK-OD-001',
            'state' => 'Draft',
            'created_by' => $admin->id,
        ]);

        Task::query()->create([
            'title' => 'Second on-demand task',
            'task_code' => 'TASK-OD-002',
            'state' => 'Draft',
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/admin/data/tasks?per_page=5')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
                'per_page',
                'total',
                'links',
            ])
            ->assertJsonPath('total', 2);
    }

    private function createAdminUser(): User
    {
        $role = Role::create([
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
