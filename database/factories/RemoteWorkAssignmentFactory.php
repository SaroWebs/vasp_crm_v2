<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\RemoteWorkAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RemoteWorkAssignment>
 */
class RemoteWorkAssignmentFactory extends Factory
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
            'notes' => fake()->sentence(),
            'assigned_by_user_id' => User::factory(),
        ];
    }
}
