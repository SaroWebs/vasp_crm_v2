<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AttendanceOverrideRequest extends FormRequest
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
            'attendance_date' => ['required', 'date'],
            'punch_in' => ['required', 'date_format:H:i'],
            'punch_out' => ['nullable', 'date_format:H:i', 'after:punch_in'],
            'mode' => ['nullable', 'string', 'in:office,remote'],
        ];
    }
}
