<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed the V1 Task Management System
        $this->call([
            V1TaskManagementSeeder::class,
        ]);

        // You can add other seeders here as needed
        // $this->call([
        //     OtherSeeder::class,
        // ]);
    }
}
