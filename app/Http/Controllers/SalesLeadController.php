<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseSalesLeadRequest;
use App\Http\Requests\StoreSalesLeadActivityRequest;
use App\Http\Requests\StoreSalesLeadRequest;
use App\Http\Requests\UpdateSalesLeadRequest;
use App\Models\Client;
use App\Models\Product;
use App\Models\SalesLead;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesLeadController extends Controller
{
    public function adminIndex(): Response
    {
        return Inertia::render('admin/sales-leads/Index', $this->pageOptions());
    }

    public function myIndex(): Response
    {
        return Inertia::render('my/sales-leads/Index', $this->pageOptions(includeSalesUsers: false));
    }

    public function adminData(Request $request): JsonResponse
    {
        $query = $this->baseLeadQuery();
        $this->applyFilters($query, $request, allowEmployeeFilter: true);

        return response()->json($this->leadIndexPayload($query, $request));
    }

    public function adminReport(Request $request): JsonResponse
    {
        $query = SalesLead::query()->with(['owner:id,name', 'product:id,name']);
        $this->applyFilters($query, $request, allowEmployeeFilter: true);

        return response()->json($this->reportPayload($query));
    }

    public function adminExport(Request $request): StreamedResponse
    {
        $query = $this->baseLeadQuery();
        $this->applyFilters($query, $request, allowEmployeeFilter: true);

        $fileName = 'sales-leads-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Organization',
                'Type',
                'Contact Person',
                'Phone',
                'Email',
                'Location',
                'Service',
                'Owner',
                'Interest',
                'Status',
                'Latest Response',
                'Last Contacted',
                'Next Follow-up',
                'Created At',
            ]);

            $query->chunk(200, function ($leads) use ($handle): void {
                foreach ($leads as $lead) {
                    fputcsv($handle, [
                        $lead->organization_name,
                        $lead->organization_type,
                        $lead->contact_person_name,
                        $lead->contact_phone,
                        $lead->contact_email,
                        $lead->location,
                        $lead->product?->name,
                        $lead->owner?->name,
                        $lead->interest_level,
                        $lead->status,
                        $lead->latest_response,
                        $lead->last_contacted_at?->toDateTimeString(),
                        $lead->next_follow_up_at?->toDateTimeString(),
                        $lead->created_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function adminShow(SalesLead $salesLead): Response
    {
        return Inertia::render('admin/sales-leads/Show', [
            ...$this->pageOptions(),
            'lead' => $this->serializeLeadDetail($salesLead),
            'backUrl' => route('admin.sales-leads.index'),
            'mode' => 'admin',
        ]);
    }

    public function myData(Request $request): JsonResponse
    {
        $query = $this->baseLeadQuery()->forOwner($request->user());
        $this->applyFilters($query, $request, allowEmployeeFilter: false);

        return response()->json($this->leadIndexPayload($query, $request));
    }

    public function myShow(Request $request, SalesLead $salesLead): Response
    {
        $this->abortUnlessOwner($request, $salesLead);

        return Inertia::render('my/sales-leads/Show', [
            ...$this->pageOptions(includeSalesUsers: false),
            'lead' => $this->serializeLeadDetail($salesLead),
            'backUrl' => route('my.sales-leads.index'),
            'mode' => 'my',
        ]);
    }

    public function adminStore(StoreSalesLeadRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['owner_user_id'] = $validated['owner_user_id'] ?? $request->user()->id;
        $validated['created_by_user_id'] = $request->user()->id;

        $lead = SalesLead::create($validated);

        return response()->json([
            'message' => 'Sales lead created successfully.',
            'lead' => $this->serializeLead($lead->fresh()),
        ], 201);
    }

    public function myStore(StoreSalesLeadRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['owner_user_id'] = $request->user()->id;
        $validated['created_by_user_id'] = $request->user()->id;

        $lead = SalesLead::create($validated);

        return response()->json([
            'message' => 'Sales lead created successfully.',
            'lead' => $this->serializeLead($lead->fresh()),
        ], 201);
    }

    public function adminUpdate(UpdateSalesLeadRequest $request, SalesLead $salesLead): JsonResponse
    {
        $validated = $request->validated();
        $validated['owner_user_id'] = $validated['owner_user_id'] ?? $salesLead->owner_user_id;
        $validated['updated_by_user_id'] = $request->user()->id;

        $salesLead->update($validated);

        return response()->json([
            'message' => 'Sales lead updated successfully.',
            'lead' => $this->serializeLead($salesLead->fresh()),
        ]);
    }

    public function myUpdate(UpdateSalesLeadRequest $request, SalesLead $salesLead): JsonResponse
    {
        $this->abortUnlessOwner($request, $salesLead);

        $validated = $request->validated();
        unset($validated['owner_user_id']);
        $validated['updated_by_user_id'] = $request->user()->id;

        $salesLead->update($validated);

        return response()->json([
            'message' => 'Sales lead updated successfully.',
            'lead' => $this->serializeLead($salesLead->fresh()),
        ]);
    }

    public function adminDestroy(SalesLead $salesLead): JsonResponse
    {
        $salesLead->delete();

        return response()->json([
            'message' => 'Sales lead archived successfully.',
        ]);
    }

    public function adminConvert(SalesLead $salesLead): JsonResponse
    {
        if ($salesLead->converted_client_id) {
            return response()->json([
                'message' => 'Sales lead has already been converted.',
                'lead' => $this->serializeLead($salesLead->fresh()),
            ], 422);
        }

        $client = DB::transaction(function () use ($salesLead): Client {
            $client = Client::create([
                'name' => $salesLead->organization_name,
                'email' => $salesLead->contact_email,
                'phone' => $salesLead->contact_phone,
                'address' => $salesLead->location,
                'status' => 'active',
                'product_id' => $salesLead->product_id,
            ]);

            $salesLead->update([
                'converted_client_id' => $client->id,
                'converted_at' => now(),
                'status' => 'won',
            ]);

            return $client;
        });

        return response()->json([
            'message' => 'Sales lead converted to client successfully.',
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
            ],
            'lead' => $this->serializeLead($salesLead->fresh()),
        ], 201);
    }

    public function adminSendReminders(NotificationService $notificationService): JsonResponse
    {
        $overdueLeads = SalesLead::query()
            ->with('owner:id,name')
            ->whereNotNull('next_follow_up_at')
            ->where('next_follow_up_at', '<', now())
            ->whereNotIn('status', ['won', 'lost', 'not_interested'])
            ->get();

        $sent = 0;
        foreach ($overdueLeads as $lead) {
            if (! $lead->owner_user_id) {
                continue;
            }

            $notificationService->sendToUser(
                $lead->owner_user_id,
                'App\Notifications\SalesLeadFollowUpReminderNotification',
                'Sales Follow-up Overdue',
                "Follow-up is overdue for {$lead->organization_name}.",
                [
                    'sales_lead_id' => $lead->id,
                    'organization_name' => $lead->organization_name,
                    'next_follow_up_at' => $lead->next_follow_up_at?->toDateTimeString(),
                    'target_url' => "/my/sales-leads/{$lead->id}",
                ]
            );
            $sent++;
        }

        return response()->json([
            'message' => "{$sent} sales follow-up reminder(s) sent.",
            'sent' => $sent,
        ]);
    }

    public function adminStoreActivity(StoreSalesLeadActivityRequest $request, SalesLead $salesLead): JsonResponse
    {
        return $this->storeActivity($request, $salesLead);
    }

    public function adminCompleteFollowUp(Request $request, SalesLead $salesLead): JsonResponse
    {
        return $this->completeFollowUp($request, $salesLead);
    }

    public function adminCloseDeal(CloseSalesLeadRequest $request, SalesLead $salesLead): JsonResponse
    {
        return $this->closeDeal($request, $salesLead);
    }

    public function myStoreActivity(StoreSalesLeadActivityRequest $request, SalesLead $salesLead): JsonResponse
    {
        $this->abortUnlessOwner($request, $salesLead);

        return $this->storeActivity($request, $salesLead);
    }

    public function myCompleteFollowUp(Request $request, SalesLead $salesLead): JsonResponse
    {
        $this->abortUnlessOwner($request, $salesLead);

        return $this->completeFollowUp($request, $salesLead);
    }

    public function myCloseDeal(CloseSalesLeadRequest $request, SalesLead $salesLead): JsonResponse
    {
        $this->abortUnlessOwner($request, $salesLead);

        return $this->closeDeal($request, $salesLead);
    }

    private function closeDeal(CloseSalesLeadRequest $request, SalesLead $salesLead): JsonResponse
    {
        if ($salesLead->status === 'won') {
            return response()->json([
                'message' => 'Sales lead is already closed as won.',
                'lead' => $this->serializeLead($salesLead->fresh()),
            ], 422);
        }

        $validated = $request->validated();
        $responseText = $validated['response_text'] ?? 'Deal closed as won.';

        $activity = DB::transaction(function () use ($request, $salesLead, $responseText) {
            $activity = $salesLead->activities()->create([
                'user_id' => $request->user()->id,
                'activity_type' => 'note',
                'outcome_status' => 'won',
                'response_text' => $responseText,
                'activity_at' => now(),
                'next_follow_up_at' => null,
            ]);

            $salesLead->update([
                'status' => 'won',
                'interest_level' => 'positive',
                'latest_response' => $responseText,
                'last_contacted_at' => $activity->activity_at,
                'next_follow_up_at' => null,
                'updated_by_user_id' => $request->user()->id,
            ]);

            return $activity;
        });

        return response()->json([
            'message' => 'Deal closed as won.',
            'activity' => $activity->fresh(),
            'lead' => $this->serializeLead($salesLead->fresh()),
        ]);
    }

    private function completeFollowUp(Request $request, SalesLead $salesLead): JsonResponse
    {
        $validated = $request->validate([
            'response_text' => ['nullable', 'string'],
        ]);

        $activity = $salesLead->activities()->create([
            'user_id' => $request->user()->id,
            'activity_type' => 'note',
            'outcome_status' => $salesLead->status,
            'response_text' => $validated['response_text'] ?? 'Follow-up completed.',
            'activity_at' => now(),
            'next_follow_up_at' => null,
        ]);

        $salesLead->update([
            'latest_response' => $activity->response_text,
            'last_contacted_at' => $activity->activity_at,
            'next_follow_up_at' => null,
            'updated_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Follow-up marked complete.',
            'activity' => $activity->fresh(),
            'lead' => $this->serializeLead($salesLead->fresh()),
        ]);
    }

    private function storeActivity(StoreSalesLeadActivityRequest $request, SalesLead $salesLead): JsonResponse
    {
        $validated = $request->validated();
        $activity = $salesLead->activities()->create([
            'user_id' => $request->user()->id,
            'activity_type' => $validated['activity_type'],
            'outcome_status' => $validated['outcome_status'] ?? null,
            'response_text' => $validated['response_text'] ?? null,
            'activity_at' => $validated['activity_at'],
            'next_follow_up_at' => $validated['next_follow_up_at'] ?? null,
        ]);

        $leadUpdates = [
            'latest_response' => $validated['response_text'] ?? $salesLead->latest_response,
            'last_contacted_at' => $validated['activity_at'],
            'next_follow_up_at' => $validated['next_follow_up_at'] ?? null,
            'updated_by_user_id' => $request->user()->id,
        ];

        if (! empty($validated['outcome_status'])) {
            $leadUpdates['status'] = $validated['outcome_status'];
        }

        if (! empty($validated['interest_level'])) {
            $leadUpdates['interest_level'] = $validated['interest_level'];
        }

        $salesLead->update($leadUpdates);

        return response()->json([
            'message' => 'Sales lead activity recorded successfully.',
            'activity' => $activity->fresh(),
            'lead' => $this->serializeLead($salesLead->fresh()),
        ], 201);
    }

    private function baseLeadQuery(): Builder
    {
        return SalesLead::query()
            ->with([
                'owner:id,name,email',
                'product:id,name',
                'latestActivity.user:id,name',
            ])
            ->withCount('activities')
            ->latest();
    }

    private function applyFilters(Builder $query, Request $request, bool $allowEmployeeFilter): void
    {
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function (Builder $query) use ($search): void {
                $query->where('organization_name', 'like', "%{$search}%")
                    ->orWhere('contact_person_name', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($allowEmployeeFilter && $request->filled('owner_user_id')) {
            $query->where('owner_user_id', $request->integer('owner_user_id'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('interest_level') && $request->interest_level !== 'all') {
            $query->where('interest_level', $request->string('interest_level'));
        }

        if ($request->filled('organization_type') && $request->organization_type !== 'all') {
            $query->where('organization_type', $request->string('organization_type'));
        }

        if ($request->filled('follow_up') && $request->follow_up !== 'all') {
            match ($request->string('follow_up')->toString()) {
                'overdue' => $query->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '<', now()),
                'upcoming' => $query->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '>=', now()),
                'none' => $query->whereNull('next_follow_up_at'),
                default => null,
            };
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function leadIndexPayload(Builder $query, Request $request): array
    {
        $metrics = $this->metricsFor(clone $query);
        $perPage = min(max($request->integer('per_page', 10), 1), 50);
        $leads = $query->paginate($perPage)->withQueryString();

        return [
            'leads' => $leads->getCollection()->map(fn (SalesLead $lead): array => $this->serializeLead($lead))->values(),
            'pagination' => [
                'current_page' => $leads->currentPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
                'last_page' => $leads->lastPage(),
            ],
            'metrics' => $metrics,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function metricsFor(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'positive' => (clone $query)->where('interest_level', 'positive')->count(),
            'overdue_followups' => (clone $query)->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '<', now())->count(),
            'upcoming_followups' => (clone $query)->whereNotNull('next_follow_up_at')->where('next_follow_up_at', '>=', now())->count(),
            'employees_active' => (clone $query)->distinct('owner_user_id')->count('owner_user_id'),
            'won' => (clone $query)->where('status', 'won')->count(),
            'lost' => (clone $query)->where('status', 'lost')->count(),
            'converted' => (clone $query)->whereNotNull('converted_client_id')->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function reportPayload(Builder $query): array
    {
        return [
            'by_employee' => (clone $query)
                ->select('owner_user_id')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when interest_level = 'positive' then 1 else 0 end) as positive")
                ->selectRaw("sum(case when status = 'won' then 1 else 0 end) as won")
                ->selectRaw("sum(case when status = 'lost' then 1 else 0 end) as lost")
                ->groupBy('owner_user_id')
                ->get()
                ->map(fn (SalesLead $lead): array => [
                    'owner_user_id' => $lead->owner_user_id,
                    'owner_name' => $lead->owner?->name ?? 'Unassigned',
                    'total' => (int) $lead->total,
                    'positive' => (int) $lead->positive,
                    'won' => (int) $lead->won,
                    'lost' => (int) $lead->lost,
                ]),
            'by_product' => (clone $query)
                ->select('product_id')
                ->selectRaw('count(*) as total')
                ->selectRaw("sum(case when interest_level = 'positive' then 1 else 0 end) as positive")
                ->groupBy('product_id')
                ->get()
                ->map(fn (SalesLead $lead): array => [
                    'product_id' => $lead->product_id,
                    'product_name' => $lead->product?->name ?? 'No service selected',
                    'total' => (int) $lead->total,
                    'positive' => (int) $lead->positive,
                ]),
            'by_status' => (clone $query)
                ->select('status')
                ->selectRaw('count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'followups_completed' => (clone $query)
                ->whereHas('activities', fn (Builder $query) => $query->where('activity_type', 'note'))
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLead(SalesLead $lead): array
    {
        $lead->loadMissing([
            'owner:id,name,email',
            'product:id,name',
            'latestActivity.user:id,name',
        ]);
        $lead->loadCount('activities');

        return [
            'id' => $lead->id,
            'owner_user_id' => $lead->owner_user_id,
            'product_id' => $lead->product_id,
            'organization_name' => $lead->organization_name,
            'organization_type' => $lead->organization_type,
            'contact_person_name' => $lead->contact_person_name,
            'contact_phone' => $lead->contact_phone,
            'contact_email' => $lead->contact_email,
            'location' => $lead->location,
            'service_notes' => $lead->service_notes,
            'interest_level' => $lead->interest_level,
            'status' => $lead->status,
            'source' => $lead->source,
            'latest_response' => $lead->latest_response,
            'last_contacted_at' => $lead->last_contacted_at?->toDateTimeString(),
            'next_follow_up_at' => $lead->next_follow_up_at?->toDateTimeString(),
            'notes' => $lead->notes,
            'activities_count' => $lead->activities_count ?? 0,
            'converted_client_id' => $lead->converted_client_id,
            'converted_at' => $lead->converted_at?->toDateTimeString(),
            'owner' => $lead->owner ? [
                'id' => $lead->owner->id,
                'name' => $lead->owner->name,
                'email' => $lead->owner->email,
            ] : null,
            'product' => $lead->product ? [
                'id' => $lead->product->id,
                'name' => $lead->product->name,
            ] : null,
            'latest_activity' => $lead->latestActivity ? [
                'id' => $lead->latestActivity->id,
                'activity_type' => $lead->latestActivity->activity_type,
                'outcome_status' => $lead->latestActivity->outcome_status,
                'response_text' => $lead->latestActivity->response_text,
                'activity_at' => $lead->latestActivity->activity_at?->toDateTimeString(),
                'next_follow_up_at' => $lead->latestActivity->next_follow_up_at?->toDateTimeString(),
                'user' => $lead->latestActivity->user ? [
                    'id' => $lead->latestActivity->user->id,
                    'name' => $lead->latestActivity->user->name,
                ] : null,
            ] : null,
            'created_at' => $lead->created_at?->toDateTimeString(),
            'updated_at' => $lead->updated_at?->toDateTimeString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLeadDetail(SalesLead $lead): array
    {
        $lead->load([
            'owner:id,name,email',
            'product:id,name',
            'createdByUser:id,name',
            'updatedByUser:id,name',
            'activities' => fn ($query) => $query->with('user:id,name')->latest('activity_at'),
        ]);
        $lead->loadCount('activities');

        return [
            ...$this->serializeLead($lead),
            'created_by_user' => $lead->createdByUser ? [
                'id' => $lead->createdByUser->id,
                'name' => $lead->createdByUser->name,
            ] : null,
            'updated_by_user' => $lead->updatedByUser ? [
                'id' => $lead->updatedByUser->id,
                'name' => $lead->updatedByUser->name,
            ] : null,
            'activities' => $lead->activities->map(fn ($activity): array => [
                'id' => $activity->id,
                'sales_lead_id' => $activity->sales_lead_id,
                'user_id' => $activity->user_id,
                'activity_type' => $activity->activity_type,
                'outcome_status' => $activity->outcome_status,
                'response_text' => $activity->response_text,
                'activity_at' => $activity->activity_at?->toDateTimeString(),
                'next_follow_up_at' => $activity->next_follow_up_at?->toDateTimeString(),
                'created_at' => $activity->created_at?->toDateTimeString(),
                'updated_at' => $activity->updated_at?->toDateTimeString(),
                'user' => $activity->user ? [
                    'id' => $activity->user->id,
                    'name' => $activity->user->name,
                ] : null,
            ])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pageOptions(bool $includeSalesUsers = true): array
    {
        $payload = [
            'products' => Product::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name']),
        ];

        if ($includeSalesUsers) {
            $payload['salesUsers'] = User::query()
                ->whereHas('roles', fn (Builder $query) => $query->whereIn('slug', ['sales', 'manager', 'admin', 'super-admin']))
                ->orderBy('name')
                ->get(['id', 'name', 'email']);
        }

        return $payload;
    }

    private function abortUnlessOwner(Request $request, SalesLead $salesLead): void
    {
        abort_unless($salesLead->owner_user_id === $request->user()->id, 404);
    }
}
