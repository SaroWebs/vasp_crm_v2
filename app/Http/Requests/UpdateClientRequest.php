<?php

namespace App\Http\Requests;

use App\Models\Client;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
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
        $client = $this->route('client');
        $clientModel = $client instanceof Client
            ? $client
            : Client::find($client);

        $secretRequired = $this->boolean('sso_enabled')
            && empty($clientModel?->sso_secret);

        return [
            'name' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'code' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', 'string'],
            'product_id' => ['nullable', 'exists:products,id'],
            'sso_enabled' => ['sometimes', 'boolean'],
            'sso_secret' => [
                Rule::requiredIf(fn (): bool => $secretRequired),
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
            'email.email' => 'The email address must be valid.',
            'phone.max' => 'The phone number may not be greater than 20 characters.',
            'code.max' => 'The client code may not be greater than 255 characters.',
            'status.required' => 'The client status is required.',
            'product_id.exists' => 'The selected product is invalid.',
            'sso_enabled.boolean' => 'The SSO enabled value must be true or false.',
            'sso_secret.required' => 'The SSO secret is required when SSO is enabled.',
        ];
    }
}
