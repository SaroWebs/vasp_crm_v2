<?php

namespace Database\Factories;

use App\Models\SalesLead;
use App\Models\SalesLeadActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesLeadActivity>
 */
class SalesLeadActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sales_lead_id' => SalesLead::factory(),
            'user_id' => User::factory(),
            'activity_type' => fake()->randomElement(['call', 'visit', 'meeting', 'whatsapp', 'email', 'note']),
            'outcome_status' => fake()->optional()->randomElement(['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost']),
            'response_text' => fake()->optional()->sentence(),
            'activity_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'next_follow_up_at' => fake()->optional()->dateTimeBetween('now', '+30 days'),
        ];
    }
}
