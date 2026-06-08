<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SalesLead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesLead>
 */
class SalesLeadFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $organizationType = fake()->randomElement(['school', 'college', 'business', 'logistics_company', 'other']);

        return [
            'owner_user_id' => User::factory(),
            'product_id' => Product::query()->inRandomOrder()->value('id')
                ?? Product::create([
                    'name' => fake()->unique()->words(2, true),
                    'status' => 'active',
                ])->id,
            'organization_name' => match ($organizationType) {
                'school' => fake()->company().' School',
                'college' => fake()->company().' College',
                'logistics_company' => fake()->company().' Logistics',
                default => fake()->company(),
            },
            'organization_type' => $organizationType,
            'contact_person_name' => fake()->name(),
            'contact_phone' => fake()->numerify('+91##########'),
            'contact_email' => fake()->safeEmail(),
            'location' => fake()->city(),
            'service_notes' => fake()->sentence(),
            'interest_level' => fake()->randomElement(['negative', 'unclear', 'positive']),
            'status' => fake()->randomElement(['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost']),
            'source' => fake()->randomElement(['cold_call', 'referral', 'field_visit', 'website', 'event']),
            'latest_response' => fake()->sentence(),
            'last_contacted_at' => fake()->optional()->dateTimeBetween('-30 days', 'now'),
            'next_follow_up_at' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
