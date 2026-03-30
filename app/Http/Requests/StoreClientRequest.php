<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'code' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive'],
            'product_id' => ['nullable', 'string', 'exists:products,id'],
            'sso_enabled' => ['sometimes', 'boolean'],
            'sso_secret' => [
                Rule::requiredIf(fn (): bool => $this->boolean('sso_enabled')),
                'nullable',
                'string',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }

                    if (! is_string($value)) {
                        $fail('The SSO secret must be a string.');

                        return;
                    }

                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 32) {
                        $fail('The SSO secret must be a base64-encoded 32-byte key.');
                    }
                },
            ],
        ];
    }

    /**
     * Get the validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The client name is required.',
            'name.max' => 'The client name may not be greater than 255 characters.',
            'email.email' => 'The email address must be valid.',
            'phone.max' => 'The phone number may not be greater than 20 characters.',
            'code.max' => 'The client code may not be greater than 255 characters.',
            'status.required' => 'The client status is required.',
            'status.in' => 'The client status must be active or inactive.',
            'product_id.exists' => 'The selected product is invalid.',
            'sso_enabled.boolean' => 'The SSO enabled value must be true or false.',
            'sso_secret.required' => 'The SSO secret is required when SSO is enabled.',
        ];
    }
}
