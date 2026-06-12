<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeTermination;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeeTermination>
 */
class EmployeeTerminationFactory extends Factory
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
            'status' => Employee::STATUS_TERMINATED,
            'termination_type' => 'termination',
            'effective_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'reason' => fake()->sentence(),
            'notes' => fake()->optional()->paragraph(),
            'created_by_user_id' => User::factory(),
        ];
    }
}
