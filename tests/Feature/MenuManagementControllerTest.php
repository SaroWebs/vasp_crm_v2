<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MenuManagementControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_menu_management_includes_attendance_menu_items(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);

        $admin = $this->createAdminUser();

        $this->actingAs($admin, 'web')
            ->get('/admin/menu')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menu/Index')
                ->has('menuGroups', 4)
                ->where('menuGroups.0.title', 'Organization')
                ->where('menuGroups.0.items.5.key', 'organization.attendance')
                ->where('menuGroups.0.items.5.title', 'Attendance')
                ->where('menuGroups.1.title', 'Tasks')
                ->where('menuGroups.1.items.5.key', 'tasks.my-attendance')
                ->where('menuGroups.1.items.5.title', 'My Attendance')
            );
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
