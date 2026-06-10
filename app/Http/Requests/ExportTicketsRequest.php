<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportTicketsRequest extends FormRequest
{
    private const TICKET_STATUSES = ['open', 'approved', 'in-progress', 'closed', 'cancelled'];

    private const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'];

    private const EXPORT_COLUMNS = [
        'ticket_number',
        'title',
        'client',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'created_by',
        'created_at',
        'tasks_count',
        'comments_count',
        'attachments_count',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->hasPermission('ticket.export');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'statuses' => ['required', 'array', 'min:1'],
            'statuses.*' => ['string', Rule::in(self::TICKET_STATUSES)],
            'priority' => ['nullable', 'string', Rule::in(self::TICKET_PRIORITIES)],
            'search' => ['nullable', 'string', 'max:255'],
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', 'distinct', Rule::in(self::EXPORT_COLUMNS)],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'statuses.required' => 'Select at least one ticket status.',
            'statuses.min' => 'Select at least one ticket status.',
            'columns.required' => 'Select at least one field to export.',
            'columns.min' => 'Select at least one field to export.',
        ];
    }
}
