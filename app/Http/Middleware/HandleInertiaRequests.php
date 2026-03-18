<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Determine the current guard type based on route prefix and authentication
        $guardType = null;
        $user = null;

        if (auth('organization')->check()) {
            $guardType = 'organization';
            $user = auth('organization')->user()->load('client');
        }

        // Check if we're on an admin route
        if (! $guardType && ($request->is('admin/*') || $request->is('admin'))) {
            if (auth('web')->check()) {
                $guardType = 'admin';
                $user = auth('web')->user()->load('roles');
            }
        } elseif (! $guardType) {
            // Admins can access settings without admin/ prefix
            if (auth('web')->check()) {
                $guardType = 'admin';
                $user = auth('web')->user()->load('roles');
            }
        }

        $menuAccess = [];
        $menuAccessConfigured = false;
        $hasAdminRole = false;

        if ($guardType === 'admin' && $user) {
            $hasAdminRole = $user->roles->contains('slug', 'admin')
                || $user->roles->contains('slug', 'super-admin');
        }

        if ($guardType === 'admin' && $user && ! $hasAdminRole && Schema::hasTable('role_menu_items')) {
            $roleIds = $user->roles->pluck('id')->filter()->values();

            if ($roleIds->isNotEmpty()) {
                $rows = DB::table('role_menu_items')
                    ->whereIn('role_id', $roleIds)
                    ->get(['menu_key', 'is_allowed']);

                $menuAccessConfigured = $rows->isNotEmpty();
                $menuAccess = $rows
                    ->groupBy('menu_key')
                    ->map(fn ($items): bool => $items->contains(fn ($item): bool => (bool) $item->is_allowed))
                    ->toArray();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
                'guard' => $guardType,
                'menu_access' => $menuAccess,
                'menu_access_configured' => $menuAccessConfigured,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
