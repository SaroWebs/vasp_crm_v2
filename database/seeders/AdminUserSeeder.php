<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        // Assign super-admin role
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        if ($superAdminRole) {
            $adminUser->roles()->sync([$superAdminRole->id]);
            $this->command->info('Admin user created and assigned super-admin role successfully!');
        } else {
            $this->command->warn('Super-admin role not found. Please run PermissionSeeder first.');
        }
    }
}
