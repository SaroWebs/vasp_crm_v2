<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GeneratePermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-permissions
                            {--refresh : Drop and recreate all permissions}
                            {--models=* : Specific models to generate permissions for}
                            {--routes=* : Specific routes to generate permissions for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically generate permissions based on models and routes';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('refresh')) {
            $this->info('Dropping existing permissions...');
            // Truncate with FK checks disabled to avoid MySQL constraint errors.
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            try {
                DB::table('role_permissions')->truncate();
                DB::table('permissions')->truncate();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }
        }

        // Generate permissions from models
        $this->generateModelPermissions();

        // Generate permissions from routes
        $this->generateRoutePermissions();

        // Add custom permissions that are not derivable from standard CRUD route conventions
        $this->generateCustomPermissions();

        $this->info('Permissions generated successfully!');

        return self::SUCCESS;
    }

    /**
     * Generate permissions based on Eloquent models.
     */
    private function generateModelPermissions(): void
    {
        $this->info('Generating permissions from models...');

        // Get all models from the app/Models directory
        $modelFiles = glob(app_path('Models/*.php'));
        $models = [];

        foreach ($modelFiles as $file) {
            $modelName = basename($file, '.php');

            // Skip base models and interfaces
            if (in_array($modelName, ['Model', 'Authenticatable', 'MustVerifyEmail'])) {
                continue;
            }

            // Check if it's a valid model
            $modelClass = 'App\\Models\\'.$modelName;
            if (class_exists($modelClass)) {
                $models[] = $modelName;
            }
        }

        // If specific models are provided, filter them
        $selectedModels = $this->option('models');
        if (! empty($selectedModels)) {
            $models = array_intersect($models, $selectedModels);
        }

        $permissions = [];
        $actions = ['create', 'read', 'update', 'delete', 'view_all', 'view_own'];

        foreach ($models as $modelName) {
            $module = $this->getModelModule($modelName);

            foreach ($actions as $action) {
                $permissionName = $this->generatePermissionName($modelName, $action);
                $permissionSlug = $this->generatePermissionSlug($module, $action);
                $description = $this->generatePermissionDescription($modelName, $action);

                $permissions[] = [
                    'name' => $permissionName,
                    'slug' => $permissionSlug,
                    'module' => $module,
                    'action' => $action,
                    'description' => $description,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert permissions
        if (! empty($permissions)) {
            foreach ($permissions as $permission) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => $permission['slug']],
                    $permission
                );
            }
            $this->info('Generated '.count($permissions).' model-based permissions.');
        }
    }

    /**
     * Generate permissions based on routes.
     */
    private function generateRoutePermissions(): void
    {
        $this->info('Generating permissions from routes...');

        // Get all routes
        $routes = app('router')->getRoutes();
        $permissions = [];
        $routeActions = [];

        foreach ($routes as $route) {
            $action = $route->getAction();
            $uri = $route->uri();
            $methods = $route->methods();

            // Skip API routes for now (we'll handle them separately)
            if (strpos($uri, 'api/') === 0) {
                continue;
            }

            // Extract controller and method
            if (isset($action['controller'])) {
                $controllerAction = $action['controller'];
                if (! is_string($controllerAction) || ! str_contains($controllerAction, '@')) {
                    continue;
                }
                [$controller, $method] = explode('@', $controllerAction, 2);
                if (! $controller || ! $method) {
                    continue;
                }

                // Extract module from controller
                $module = $this->getModuleFromController($controller);

                // Generate permissions based on HTTP method and controller action
                $httpMethod = $methods[0]; // Use the first method
                $permissionData = $this->generatePermissionFromRoute($httpMethod, $method, $module);

                if ($permissionData) {
                    $routeActions[] = $permissionData;
                }
            }
        }

        // Group and deduplicate route permissions
        $uniquePermissions = [];
        foreach ($routeActions as $action) {
            $key = $action['module'].'.'.$action['action'];
            if (! isset($uniquePermissions[$key])) {
                $uniquePermissions[$key] = $action;
            }
        }

        // Insert permissions
        if (! empty($uniquePermissions)) {
            foreach ($uniquePermissions as $permission) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => $permission['slug']],
                    $permission
                );
            }
            $this->info('Generated '.count($uniquePermissions).' route-based permissions.');
        }
    }

    /**
     * Generate custom permissions for non-CRUD actions.
     */
    private function generateCustomPermissions(): void
    {
        $this->info('Generating custom permissions...');

        $permissions = [
            [
                'name' => 'Project Restore',
                'slug' => 'project.restore',
                'module' => 'project',
                'action' => 'restore',
                'description' => 'Restore project',
            ],
            [
                'name' => 'Project Manage Team',
                'slug' => 'project.manage_team',
                'module' => 'project',
                'action' => 'manage_team',
                'description' => 'Manage project team',
            ],
            [
                'name' => 'Project Manage Milestones',
                'slug' => 'project.manage_milestones',
                'module' => 'project',
                'action' => 'manage_milestones',
                'description' => 'Manage project milestones',
            ],
            [
                'name' => 'Project Manage Phases',
                'slug' => 'project.manage_phases',
                'module' => 'project',
                'action' => 'manage_phases',
                'description' => 'Manage project phases',
            ],
            [
                'name' => 'Project Manage Timeline',
                'slug' => 'project.manage_timeline',
                'module' => 'project',
                'action' => 'manage_timeline',
                'description' => 'Manage project timeline',
            ],
            [
                'name' => 'Project Manage Attachments',
                'slug' => 'project.manage_attachments',
                'module' => 'project',
                'action' => 'manage_attachments',
                'description' => 'Manage project attachments',
            ],
            [
                'name' => 'Project View Reports',
                'slug' => 'project.view_reports',
                'module' => 'project',
                'action' => 'view_reports',
                'description' => 'View project reports',
            ],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                array_merge($permission, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Get the module name from a model name.
     */
    private function getModelModule(string $modelName): string
    {
        // Map model names to modules
        $moduleMap = [
            'User' => 'user',
            'Role' => 'role',
            'Permission' => 'permission',
            'Task' => 'task',
            'Ticket' => 'ticket',
            'Client' => 'client',
            'Product' => 'product',
            'Department' => 'department',
            'Project' => 'project',
            'Employee' => 'employee',
            'ActivityLog' => 'activity',
            'Notification' => 'notification',
        ];

        return $moduleMap[$modelName] ?? Str::snake(Str::plural($modelName));
    }

    /**
     * Generate a permission name from model and action.
     */
    private function generatePermissionName(string $modelName, string $action): string
    {
        return Str::title($modelName).' '.Str::title(str_replace('_', ' ', $action));
    }

    /**
     * Generate a permission slug from module and action.
     */
    private function generatePermissionSlug(string $module, string $action): string
    {
        return $module.'.'.$action;
    }

    /**
     * Generate a permission description.
     */
    private function generatePermissionDescription(string $modelName, string $action): string
    {
        $descriptions = [
            'create' => 'Create new '.Str::snake($modelName, ' '),
            'read' => 'View '.Str::snake($modelName, ' '),
            'update' => 'Update '.Str::snake($modelName, ' '),
            'delete' => 'Delete '.Str::snake($modelName, ' '),
            'view_all' => 'View all '.Str::snake(Str::plural($modelName), ' '),
            'view_own' => 'View own '.Str::snake($modelName, ' '),
        ];

        return $descriptions[$action] ?? 'Manage '.Str::snake($modelName, ' ');
    }

    /**
     * Get the module name from a controller.
     */
    private function getModuleFromController(string $controller): string
    {
        // Extract the controller class name
        $controllerClass = class_basename($controller);

        // Remove 'Controller' suffix
        $modelName = str_replace('Controller', '', $controllerClass);

        return $this->getModelModule($modelName);
    }

    /**
     * Generate permission data from route information.
     */
    private function generatePermissionFromRoute(string $httpMethod, string $method, string $module): ?array
    {
        // Map HTTP methods to actions
        $actionMap = [
            'GET' => [
                'index' => 'view_all',
                'create' => 'create',
                'show' => 'read',
                'edit' => 'update',
            ],
            'POST' => [
                'store' => 'create',
            ],
            'PUT' => [
                'update' => 'update',
            ],
            'PATCH' => [
                'update' => 'update',
            ],
            'DELETE' => [
                'destroy' => 'delete',
            ],
        ];

        if (isset($actionMap[$httpMethod][$method])) {
            $action = $actionMap[$httpMethod][$method];
            $name = Str::title(Str::snake($module, ' ')).' '.Str::title(str_replace('_', ' ', $action));
            $slug = $module.'.'.$action;

            return [
                'name' => $name,
                'slug' => $slug,
                'module' => $module,
                'action' => $action,
                'description' => $this->generatePermissionDescription(Str::studly(Str::singular($module)), $action),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        return null;
    }
}
