<?php

namespace App\Http\Requests;

use App\Models\Employee;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
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
        $employee = $this->route('employee');
        $requiresTerminationDetails = in_array($this->input('status'), [
            Employee::STATUS_INACTIVE,
            Employee::STATUS_TERMINATED,
        ], true);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('employees', 'email')->ignore($employee),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('employees', 'code')->ignore($employee),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'office_ids' => ['required', 'array', 'min:1'],
            'office_ids.*' => ['integer', 'distinct', 'exists:offices,id'],
            'active_office_id' => [
                'required',
                'integer',
                'exists:offices,id',
                Rule::in($this->input('office_ids', [])),
            ],
            'status' => ['required', Rule::in(Employee::STATUSES)],
            'termination_type' => [
                Rule::requiredIf($requiresTerminationDetails),
                'nullable',
                Rule::in(['resignation', 'termination', 'retirement', 'end_of_contract', 'redundancy', 'other']),
            ],
            'effective_date' => [
                Rule::requiredIf($requiresTerminationDetails),
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'reason' => [Rule::requiredIf($requiresTerminationDetails), 'nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'active_office_id.in' => 'The primary office must be one of the assigned offices.',
            'termination_type.required' => 'Select a separation type when making an employee inactive or terminated.',
            'effective_date.required' => 'Enter the effective date for this status change.',
            'effective_date.before_or_equal' => 'The effective date cannot be in the future.',
            'reason.required' => 'Enter a reason for this status change.',
        ];
    }
}
