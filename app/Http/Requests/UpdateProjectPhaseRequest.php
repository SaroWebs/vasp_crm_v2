<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProjectPhaseRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', 'in:pending,active,completed,on_hold'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'color' => ['nullable', 'string', 'max:7'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $project = $this->route('project');
                $phase = $this->route('phase');

                if (! $project || ! $phase) {
                    return;
                }

                $startDate = $this->date('start_date') ?? $phase->start_date;
                $endDate = $this->date('end_date') ?? $phase->end_date;

                if ($startDate && $endDate && $endDate->lessThan($startDate)) {
                    $validator->errors()->add('end_date', 'The planning milestone end date must be on or after its start date.');
                }

                if ($project->start_date && $startDate?->lessThan($project->start_date)) {
                    $validator->errors()->add('start_date', 'The planning milestone cannot start before the project starts.');
                }

                if ($project->end_date && $endDate?->greaterThan($project->end_date)) {
                    $validator->errors()->add('end_date', 'The planning milestone cannot end after the project ends.');
                }
            },
        ];
    }
}
