<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportTasksRequest extends FormRequest
{
    private const TASK_STATES = [
        'Draft',
        'Assigned',
        'InProgress',
        'Blocked',
        'InReview',
        'Done',
        'Cancelled',
        'Rejected',
    ];

    private const TASK_PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

    private const EXPORT_COLUMNS = [
        'task_code',
        'title',
        'ticket',
        'client',
        'description',
        'type',
        'priority',
        'state',
        'assigned_to',
        'department',
        'start_at',
        'due_at',
        'completed_at',
        'estimate_hours',
        'created_by',
        'created_at',
        'completion_notes',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->hasPermission('task.export');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'states' => ['required', 'array', 'min:1'],
            'states.*' => ['string', Rule::in(self::TASK_STATES)],
            'priority' => ['nullable', 'string', Rule::in(self::TASK_PRIORITIES)],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'search' => ['nullable', 'string', 'max:255'],
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', 'distinct', Rule::in(self::EXPORT_COLUMNS)],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'states.required' => 'Select at least one task state.',
            'states.min' => 'Select at least one task state.',
            'columns.required' => 'Select at least one field to export.',
            'columns.min' => 'Select at least one field to export.',
        ];
    }
}
