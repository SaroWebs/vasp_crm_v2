<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class FetchWorkloadMatrixTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::guard('web')->check();
    }

    /**
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'segment' => ['required', 'string', 'in:pending,in_progress'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'in:5,10,25,50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'An employee is required.',
            'user_id.integer' => 'The employee must be a valid user.',
            'user_id.exists' => 'The selected employee is invalid.',
            'segment.required' => 'A workload segment is required.',
            'segment.in' => 'The workload segment must be pending or in progress.',
            'page.integer' => 'The page must be a number.',
            'page.min' => 'The page must be at least 1.',
            'per_page.integer' => 'The per page value must be a number.',
            'per_page.in' => 'The per page value must be 5, 10, 25, or 50.',
        ];
    }
}
