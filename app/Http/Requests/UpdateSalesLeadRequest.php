<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateSalesLeadRequest extends FormRequest
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
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'organization_name' => ['required', 'string', 'max:255'],
            'organization_type' => ['required', Rule::in(['school', 'college', 'business', 'logistics_company', 'other'])],
            'contact_person_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'service_notes' => ['nullable', 'string'],
            'interest_level' => ['required', Rule::in(['negative', 'unclear', 'positive'])],
            'status' => ['required', Rule::in(['new', 'contacted', 'follow_up', 'interested', 'not_interested', 'won', 'lost'])],
            'source' => ['nullable', 'string', 'max:255'],
            'latest_response' => ['nullable', 'string'],
            'last_contacted_at' => ['nullable', 'date'],
            'next_follow_up_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'organization_name.required' => 'The organization name is required.',
            'organization_type.required' => 'The organization type is required.',
            'organization_type.in' => 'The organization type is invalid.',
            'interest_level.required' => 'The interest level is required.',
            'interest_level.in' => 'The interest level is invalid.',
            'status.required' => 'The lead status is required.',
            'status.in' => 'The lead status is invalid.',
            'product_id.exists' => 'The selected service is invalid.',
            'owner_user_id.exists' => 'The selected sales employee is invalid.',
        ];
    }
}
