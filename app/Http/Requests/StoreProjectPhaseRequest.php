<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProjectPhaseRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', 'in:pending,active,completed,on_hold'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'color' => ['nullable', 'string', 'max:7'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_date.required' => 'A planning milestone must have a start date.',
            'end_date.required' => 'A planning milestone must have an end date.',
            'end_date.after_or_equal' => 'The planning milestone end date must be on or after its start date.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $project = $this->route('project');

                if (! $project) {
                    return;
                }

                if ($project->start_date && $this->date('start_date')?->lessThan($project->start_date)) {
                    $validator->errors()->add('start_date', 'The planning milestone cannot start before the project starts.');
                }

                if ($project->end_date && $this->date('end_date')?->greaterThan($project->end_date)) {
                    $validator->errors()->add('end_date', 'The planning milestone cannot end after the project ends.');
                }
            },
        ];
    }
}
