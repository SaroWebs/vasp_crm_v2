<?php

namespace Database\Factories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition()
    {
        return [
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'task_code' => $this->faker->unique()->bothify('TASK-##'),
            'ticket_id' => null,
            'parent_task_id' => null,
            'assigned_department_id' => null,
            'status' => 'pending',
            'priority' => 'medium',
            'due_at' => $this->faker->dateTimeBetween('now', '+1 week'),
            'task_type_id' => null,
            'sla_policy_id' => null,
            'estimated_hours' => $this->faker->numberBetween(1, 8),
            'actual_hours' => null,
            'progress' => 0,
            'state' => 'Draft',
            'workflow_definition' => [],
            'metadata' => [],
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}