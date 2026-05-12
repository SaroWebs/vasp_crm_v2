<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition()
    {
        return [
            'task_code' => $this->faker->unique()->bothify('TASK-####'),
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'task_type_id' => null,
            'sla_policy_id' => null,
            'project_id' => null,
            'department_id' => null,
            'current_owner_kind' => 'UNASSIGNED',
            'current_owner_id' => null,
            'state' => 'Draft',
            'start_at' => null,
            'due_at' => $this->faker->dateTimeBetween('now', '+1 week'),
            'completed_at' => null,
            'estimate_hours' => $this->faker->randomFloat(2, 1, 8),
            'tags' => [],
            'version' => 1,
            'metadata' => [],
            'parent_task_id' => null,
            'ticket_id' => null,
            'created_by' => User::factory(),
            'assigned_to' => null,
            'assigned_department_id' => null,
            'completion_notes' => null,
        ];
    }
}
