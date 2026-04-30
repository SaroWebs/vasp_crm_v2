<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AttendanceUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Upload request can be done from other devices
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
        return [
            'EmployeeId' => ['required', 'integer'],
            'MachineId' => ['required', 'integer'],
            'PunchTime' => ['required', 'date'],
            'Ip' => ['nullable', 'string'],
            'GroupName' => ['nullable', 'string'],
            'EmployeeName' => ['nullable', 'string'],
            'Islive' => ['nullable', 'boolean'],
        ];
    }
}
