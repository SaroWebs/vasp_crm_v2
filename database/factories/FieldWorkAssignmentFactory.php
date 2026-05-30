<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\FieldWorkAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FieldWorkAssignment>
 */
class FieldWorkAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'start_date' => fake()->date(),
            'end_date' => fake()->date(),
            'location' => fake()->city(),
            'description' => fake()->sentence(),
            'custom_start_time' => null,
            'custom_end_time' => null,
            'assigned_by_user_id' => User::factory(),
            'notes' => null,
            'status' => 'approved',
        ];
    }
}
