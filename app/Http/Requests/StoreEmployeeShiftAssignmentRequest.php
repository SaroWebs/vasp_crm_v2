<?php

namespace App\Http\Requests;

use App\Models\Employee;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeShiftAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $activeEmployee = Rule::exists('employees', 'id')
            ->where(fn ($query) => $query->where('status', Employee::STATUS_ACTIVE));

        return [
            'employee_ids' => ['required_without:employee_id', 'array'],
            'employee_ids.*' => ['integer', $activeEmployee],
            'employee_id' => ['required_without:employee_ids', 'integer', $activeEmployee],
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
