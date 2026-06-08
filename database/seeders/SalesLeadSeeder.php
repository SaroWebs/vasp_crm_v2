<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Role;
use App\Models\SalesLead;
use App\Models\User;
use Illuminate\Database\Seeder;

class SalesLeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $salesRole = Role::firstOrCreate(
            ['slug' => 'sales'],
            [
                'name' => 'Sales',
                'guard_name' => 'web',
                'description' => 'Sales employee for lead generation and follow-up work.',
                'level' => 1,
            ]
        );

        $product = Product::firstOrCreate(
            ['name' => 'School ERP'],
            ['status' => 'active']
        );

        User::factory()
            ->count(3)
            ->create(['status' => 'active'])
            ->each(function (User $user) use ($product, $salesRole): void {
                $user->assignRole($salesRole);

                SalesLead::factory()
                    ->count(4)
                    ->for($user, 'owner')
                    ->state(['product_id' => $product->id])
                    ->hasActivities(2)
                    ->create();
            });
    }
}
