<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name'        => 'EDNECT',
                'description' => 'School ERP platform designed for academic and administrative management.',
                'version'     => 'v1.0',
                'status'      => 'active',
                'metadata'    => json_encode([
                    'modules' => ['Attendance', 'Fees', 'Exams'],
                    'support' => 'standard'
                ]),
            ],
            [
                'name'        => 'TRANSTRACT',
                'description' => 'Transport management system with GPS tracking and route optimization.',
                'version'     => 'v2.3',
                'status'      => 'active',
                'metadata'    => json_encode([
                    'modules' => ['GPS Tracking', 'Driver App', 'Route Planner'],
                    'support' => 'premium'
                ]),
            ],
            [
                'name'        => 'DESALITE',
                'description' => 'School communication & MIS platform for teachers, parents, and students.',
                'version'     => 'v3.1',
                'status'      => 'inactive',
                'metadata'    => json_encode([
                    'modules' => ['Messaging', 'Homework', 'Notifications'],
                    'support' => 'basic'
                ]),
            ],
        ];

        foreach ($products as $product) {
            DB::table('products')->updateOrInsert(
                ['name' => $product['name']],
                array_merge($product, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
