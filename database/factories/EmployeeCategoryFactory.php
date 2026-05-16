<?php

namespace Database\Factories;

use App\Models\EmployeeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeCategory>
 */
class EmployeeCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'applicable_to' => 'staff',
            'status' => 'active',
            'remarks' => null,
        ];
    }
}
