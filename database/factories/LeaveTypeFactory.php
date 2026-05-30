<?php

namespace Database\Factories;

use App\Models\LeaveType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaveType>
 */
class LeaveTypeFactory extends Factory
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
            'description' => fake()->sentence(),
            'duration_type' => 'full_day',
            'default_hours' => null,
            'requires_approval' => true,
            'is_paid' => true,
            'carry_over_allowed' => false,
            'is_active' => true,
        ];
    }
}
