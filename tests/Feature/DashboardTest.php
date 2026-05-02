<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_employee_dashboard_includes_time_spent_chart_data()
    {
        $user = User::factory()->create();
        $task = Task::factory()->create();

        TaskTimeEntry::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now()->subDays(1)->subHours(2),
            'end_time' => now()->subDays(1)->subHours(1),
            'description' => 'Test time entry',
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->has('timeSpentChartData.weekly')
                ->has('timeSpentChartData.monthly')
                ->where('timeSpentChartData.weekly', fn ($weekly) => count($weekly) === 7)
                ->where('timeSpentChartData.monthly', fn ($monthly) => count($monthly) === 30)
            );
    }

    public function test_admin_dashboard_shared_auth_includes_roles(): void
    {
        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin']);
        $admin = User::factory()->create(['session_id' => session()->getId()]);
        $admin->roles()->attach($role->id);

        $this->withoutMiddleware(ValidateUserSession::class)
            ->actingAs($admin, 'web')
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('auth.user.roles', 1)
                ->where('auth.user.roles.0.slug', 'super-admin')
            );
    }
}
