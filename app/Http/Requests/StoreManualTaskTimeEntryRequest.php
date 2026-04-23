<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Models\TaskTimeEntry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class StoreManualTaskTimeEntryRequest extends FormRequest
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
        return [
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var Task|null $task */
                $task = $this->route('task');

                if (! $task instanceof Task) {
                    return;
                }

                $timezone = (string) config('app.timezone', 'UTC');

                try {
                    $start = Carbon::parse((string) $this->input('start_time'))->setTimezone($timezone);
                    $end = Carbon::parse((string) $this->input('end_time'))->setTimezone($timezone);
                } catch (\Throwable) {
                    return;
                }

                $now = Carbon::now($timezone);

                if ($start->greaterThan($now)) {
                    $validator->errors()->add('start_time', 'Start time cannot be in the future.');
                }

                if ($end->greaterThan($now)) {
                    $validator->errors()->add('end_time', 'End time cannot be in the future.');
                }

                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $overlappingEntryExists = TaskTimeEntry::query()
                    ->where('task_id', $task->id)
                    ->where('start_time', '<', $end)
                    ->where(function ($query) use ($start) {
                        $query
                            ->whereNull('end_time')
                            ->orWhere('end_time', '>', $start);
                    })
                    ->exists();

                if ($overlappingEntryExists) {
                    $validator->errors()->add('start_time', 'Time entry overlaps with an existing time entry.');
                }
            },
        ];
    }
}
