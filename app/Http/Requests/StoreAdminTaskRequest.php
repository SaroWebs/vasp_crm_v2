<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdminTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_code' => ['nullable', 'string', 'unique:tasks,task_code'],
            'ticket_id' => ['nullable', 'exists:tickets,id'],
            'parent_task_id' => ['nullable', 'exists:tasks,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'task_type_id' => ['nullable', 'exists:task_types,id'],
            'sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'phase_id' => ['nullable', 'exists:project_phases,id'],
            'start_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'completed_at' => ['nullable', 'date'],
            'estimate_hours' => ['nullable', 'numeric', 'min:0'],
            'tags' => ['nullable', 'array'],
            'version' => ['nullable', 'integer'],
            'metadata' => ['nullable', 'array'],
            'completion_notes' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:20480'],
            'assignments' => ['nullable', 'array'],
            'assignments.*.user_id' => ['required', 'exists:users,id'],
            'assignments.*.assignment_notes' => ['nullable', 'string'],
            'assignments.*.estimated_time' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'due_at.after_or_equal' => 'The due date and time must be after the task start date and time.',
            'phase_id.exists' => 'The selected project phase is no longer available.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'tags' => $this->decodeJsonArray('tags'),
            'metadata' => $this->decodeJsonArray('metadata'),
        ]);
    }

    private function decodeJsonArray(string $key): mixed
    {
        $value = $this->input($key);

        if (! is_string($value)) {
            return $value;
        }

        if ($value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE && is_array($decoded) ? $decoded : [];
    }
}
