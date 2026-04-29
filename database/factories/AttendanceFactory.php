<?php

namespace Database\Factories;

use App\Models\Attendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $punchIn = fake()->time('H:i:s', '09:30:00');
        $punchOut = fake()->time('H:i:s', '18:00:00');
        $date = fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d');

        return [
            'employee_id' => fake()->numerify('EMP-####'),
            'machine_id' => fake()->numberBetween(1, 10),
            'attendance_date' => $date,
            'punch_in' => $punchIn,
            'punch_out' => $punchOut,
            'ip' => fake()->ipv4(),
            'employee_name' => fake()->name(),
            'group_name' => fake()->word(),
            'is_live' => false,
            'mode' => fake()->randomElement(['office', 'remote']),
        ];
    }

    public function withoutPunchOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'punch_out' => null,
        ]);
    }
}
