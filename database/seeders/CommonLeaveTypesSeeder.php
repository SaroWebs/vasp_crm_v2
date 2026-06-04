<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class CommonLeaveTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Casual Leave',
                'description' => 'General casual leave for personal purposes (12 days/year)',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Sick Leave',
                'description' => 'Leave for medical reasons (8 days/year)',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Annual Leave',
                'description' => 'Planned vacation/holiday leave (20 days/year)',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Privilege Leave',
                'description' => 'Special privilege leave (10 days/year)',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave',
                'description' => 'Leave for expectant/nursing mothers (180 hours)',
                'duration_type' => 'custom_hours',
                'default_hours' => 180,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Paternity Leave',
                'description' => 'Leave for new fathers (60 hours)',
                'duration_type' => 'custom_hours',
                'default_hours' => 60,
                'requires_approval' => true,
                'is_paid' => true,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Compensatory Off',
                'description' => 'Leave given for holiday/weekend work',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => false,
                'is_paid' => false,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Unpaid Leave',
                'description' => 'Leave without pay for extended absences',
                'duration_type' => 'full_day',
                'default_hours' => null,
                'requires_approval' => true,
                'is_paid' => false,
                'carry_over_allowed' => false,
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $leaveType) {
            LeaveType::firstOrCreate(
                ['name' => $leaveType['name']],
                $leaveType
            );
        }
    }
}
