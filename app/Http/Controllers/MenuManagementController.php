<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class MenuManagementController extends Controller
{
    /**
     * Menu items that can be managed for non-admin roles.
     *
     * @var array<int, array<string, mixed>>
     */
    private const MENU_GROUPS = [
        [
            'title' => 'Organization',
            'items' => [
                ['key' => 'organization.departments', 'title' => 'Departments', 'default_roles' => ['super-admin', 'admin', 'manager']],
                ['key' => 'organization.products', 'title' => 'Products', 'default_roles' => ['super-admin', 'admin', 'manager']],
                ['key' => 'organization.projects', 'title' => 'Projects', 'default_roles' => ['super-admin', 'admin', 'manager', 'team-lead']],
                ['key' => 'organization.employees', 'title' => 'Employees', 'default_roles' => ['super-admin', 'admin', 'manager']],
                ['key' => 'organization.clients', 'title' => 'Clients', 'default_roles' => ['super-admin', 'admin', 'manager']],
            ],
        ],
        [
            'title' => 'Tasks',
            'items' => [
                ['key' => 'tasks.tickets', 'title' => 'Tickets', 'default_roles' => ['super-admin', 'admin', 'support-agent', 'team-lead', 'manager']],
                ['key' => 'tasks.tasks', 'title' => 'Tasks', 'default_roles' => ['super-admin', 'admin', 'manager', 'team-lead', 'developer', 'employee']],
                ['key' => 'tasks.task-reports', 'title' => 'Task Reports', 'default_roles' => ['super-admin', 'admin', 'manager', 'team-lead']],
                ['key' => 'tasks.workload-matrix', 'title' => 'Workload Matrix', 'default_roles' => ['super-admin', 'admin', 'manager', 'team-lead']],
                ['key' => 'tasks.my-tasks', 'title' => 'My Tasks', 'default_roles' => null],
            ],
        ],
        [
            'title' => 'Security',
            'items' => [
                ['key' => 'security.roles-permissions', 'title' => 'Roles & Permissions', 'default_roles' => ['super-admin', 'admin']],
            ],
        ],
        [
            'title' => 'System',
            'items' => [
                ['key' => 'system.notifications', 'title' => 'Notifications', 'default_roles' => null],
            ],
        ],
    ];

    /**
     * Show menu access management.
     */
    public function index(Request $request): Response
    {
        $this->authorizeAdminAccess();

        $roles = $this->managedRoles();
        $storedAssignments = collect();

        if (Schema::hasTable('role_menu_items')) {
            $storedAssignments = DB::table('role_menu_items')
                ->whereIn('role_id', $roles->pluck('id'))
                ->get(['role_id', 'menu_key', 'is_allowed'])
                ->groupBy('role_id');
        }

        $menuGroups = collect(self::MENU_GROUPS)
            ->map(function (array $group): array {
                return [
                    'title' => $group['title'],
                    'items' => collect($group['items'])
                        ->map(fn (array $item): array => [
                            'key' => $item['key'],
                            'title' => $item['title'],
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        $menuKeys = collect($this->flatMenuItems())->pluck('key')->values()->all();
        $assignments = [];

        foreach ($roles as $role) {
            $roleAssignments = [];
            $storedRoleAssignments = collect($storedAssignments->get($role->id, []))
                ->keyBy('menu_key');

            foreach ($menuKeys as $menuKey) {
                $storedRow = $storedRoleAssignments->get($menuKey);
                $isAllowed = $storedRow
                    ? (bool) $storedRow->is_allowed
                    : $this->isDefaultAllowed($role->slug, $menuKey);

                if ($isAllowed) {
                    $roleAssignments[] = $menuKey;
                }
            }

            $assignments[(string) $role->id] = $roleAssignments;
        }

        return Inertia::render('admin/menu/Index', [
            'roles' => $roles->values()->all(),
            'menuGroups' => $menuGroups,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Save menu access assignments for non-admin roles.
     */
    public function update(Request $request): RedirectResponse
    {
        $this->authorizeAdminAccess();

        if (!Schema::hasTable('role_menu_items')) {
            return back()->withErrors([
                'menu' => 'Menu access table is missing. Please run migrations first.',
            ]);
        }

        $validated = $request->validate([
            'assignments' => ['required', 'array'],
            'assignments.*' => ['array'],
            'assignments.*.*' => ['string'],
        ]);

        $roles = $this->managedRoles();
        $menuKeys = collect($this->flatMenuItems())->pluck('key')->values();
        $incomingAssignments = collect($validated['assignments']);
        $now = now();

        $rows = [];
        foreach ($roles as $role) {
            $selectedKeys = collect($incomingAssignments->get((string) $role->id, []))
                ->filter(fn ($key): bool => is_string($key))
                ->intersect($menuKeys)
                ->values();

            foreach ($menuKeys as $menuKey) {
                $rows[] = [
                    'role_id' => $role->id,
                    'menu_key' => $menuKey,
                    'is_allowed' => $selectedKeys->contains($menuKey),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (empty($rows)) {
            return back()->with('success', 'Menu access updated successfully.');
        }

        DB::transaction(function () use ($rows): void {
            DB::table('role_menu_items')->upsert(
                $rows,
                ['role_id', 'menu_key'],
                ['is_allowed', 'updated_at']
            );
        });

        return back()->with('success', 'Menu access updated successfully.');
    }

    /**
     * Ensure only admin-level roles can access this page.
     */
    private function authorizeAdminAccess(): void
    {
        $user = Auth::guard('web')->user();

        if (!$user || (!$user->hasRole('admin') && !$user->hasRole('super-admin'))) {
            abort(403, 'Only administrators can manage menu access.');
        }
    }

    /**
     * Roles that can be managed on menu access screen.
     */
    private function managedRoles()
    {
        return Role::query()
            ->whereNotIn('slug', ['super-admin', 'admin'])
            ->orderByDesc('level')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'level']);
    }

    /**
     * Flatten all managed menu items.
     *
     * @return array<int, array{key: string, title: string, default_roles: ?array<int, string>}>
     */
    private function flatMenuItems(): array
    {
        return collect(self::MENU_GROUPS)
            ->flatMap(fn (array $group): array => $group['items'])
            ->values()
            ->all();
    }

    /**
     * Whether a role should have an item by default.
     */
    private function isDefaultAllowed(string $roleSlug, string $menuKey): bool
    {
        $menuItem = collect($this->flatMenuItems())
            ->first(fn (array $item): bool => $item['key'] === $menuKey);

        if (!$menuItem) {
            return false;
        }

        if (!array_key_exists('default_roles', $menuItem) || $menuItem['default_roles'] === null) {
            return true;
        }

        return in_array($roleSlug, $menuItem['default_roles'], true);
    }
}
