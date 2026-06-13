<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderProjectPhasesRequest extends FormRequest
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
        $projectId = $this->route('project')?->id;

        return [
            'phases' => ['required', 'array'],
            'phases.*.id' => [
                'required',
                Rule::exists('project_phases', 'id')->where('project_id', $projectId),
            ],
            'phases.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
