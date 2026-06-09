<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreSalesLeadActivityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::guard('web')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'activity_type' => ['required', Rule::in(['call', 'visit', 'meeting', 'whatsapp', 'email', 'note'])],
            'outcome_status' => ['nullable', Rule::in(['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost'])],
            'interest_level' => ['nullable', Rule::in(['negative', 'unclear', 'positive'])],
            'response_text' => ['nullable', 'string'],
            'activity_at' => ['required', 'date'],
            'next_follow_up_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'activity_type.required' => 'The activity type is required.',
            'activity_type.in' => 'The activity type is invalid.',
            'outcome_status.in' => 'The activity outcome is invalid.',
            'interest_level.in' => 'The interest level is invalid.',
            'activity_at.required' => 'The activity date is required.',
        ];
    }
}
