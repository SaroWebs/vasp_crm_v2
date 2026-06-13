<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('project_milestones')) {
            $projects = DB::table('projects')
                ->select('id', 'start_date')
                ->get()
                ->keyBy('id');

            $milestonesByProject = DB::table('project_milestones')
                ->whereNull('deleted_at')
                ->orderBy('project_id')
                ->orderBy('sort_order')
                ->orderBy('target_date')
                ->get()
                ->groupBy('project_id');

            foreach ($milestonesByProject as $projectId => $milestones) {
                $previousEndDate = $projects->get($projectId)?->start_date;

                foreach ($milestones as $milestone) {
                    $targetDate = Carbon::parse($milestone->target_date)->toDateString();
                    $startDate = $previousEndDate
                        ? Carbon::parse($previousEndDate)->toDateString()
                        : $targetDate;

                    if ($startDate > $targetDate) {
                        $startDate = $targetDate;
                    }

                    $legacyData = [
                        'id' => $milestone->id,
                        'type' => $milestone->type,
                        'target_date' => $targetDate,
                        'completed_date' => $milestone->completed_date,
                        'status' => $milestone->status,
                        'metadata' => $this->decodeJson($milestone->metadata),
                    ];

                    $existingPhase = DB::table('project_phases')
                        ->where('project_id', $projectId)
                        ->where('name', $milestone->name)
                        ->whereDate('end_date', $targetDate)
                        ->first();

                    if ($existingPhase) {
                        $settings = $this->decodeJson($existingPhase->settings);
                        $settings['legacy_project_milestones'] = array_values(array_merge(
                            $settings['legacy_project_milestones'] ?? [],
                            [$legacyData]
                        ));

                        DB::table('project_phases')
                            ->where('id', $existingPhase->id)
                            ->update(['settings' => json_encode($settings)]);
                    } else {
                        DB::table('project_phases')->insert([
                            'project_id' => $projectId,
                            'name' => $milestone->name,
                            'description' => $milestone->description,
                            'sort_order' => $milestone->sort_order,
                            'start_date' => $startDate,
                            'end_date' => $targetDate,
                            'status' => $this->mapPhaseStatus($milestone->status),
                            'progress' => $milestone->progress,
                            'color' => null,
                            'settings' => json_encode([
                                'legacy_project_milestones' => [$legacyData],
                            ]),
                            'created_at' => $milestone->created_at,
                            'updated_at' => $milestone->updated_at,
                            'deleted_at' => null,
                        ]);
                    }

                    $previousEndDate = $targetDate;
                }
            }

            Schema::drop('project_milestones');
        }

        $this->mergeMilestonePermissionIntoPhasePermission();
    }

    public function down(): void
    {
        if (! Schema::hasTable('project_milestones')) {
            Schema::create('project_milestones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->date('target_date');
                $table->date('completed_date')->nullable();
                $table->enum('status', ['pending', 'in_progress', 'completed', 'overdue'])->default('pending');
                $table->enum('type', ['start', 'checkpoint', 'delivery', 'completion', 'custom'])->default('custom');
                $table->integer('progress')->default(0);
                $table->integer('sort_order')->default(0);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['project_id', 'status']);
                $table->index(['project_id', 'target_date']);
            });
        }

        DB::table('project_phases')
            ->whereNotNull('settings')
            ->orderBy('id')
            ->get()
            ->each(function (object $phase): void {
                $legacyMilestones = $this->decodeJson($phase->settings)['legacy_project_milestones'] ?? [];

                foreach ($legacyMilestones as $legacyMilestone) {
                    DB::table('project_milestones')->insertOrIgnore([
                        'id' => $legacyMilestone['id'],
                        'project_id' => $phase->project_id,
                        'name' => $phase->name,
                        'description' => $phase->description,
                        'target_date' => $legacyMilestone['target_date'] ?? $phase->end_date,
                        'completed_date' => $legacyMilestone['completed_date'] ?? null,
                        'status' => $legacyMilestone['status'] ?? 'pending',
                        'type' => $legacyMilestone['type'] ?? 'custom',
                        'progress' => $phase->progress,
                        'sort_order' => $phase->sort_order,
                        'metadata' => json_encode($legacyMilestone['metadata'] ?? []),
                        'created_at' => $phase->created_at,
                        'updated_at' => $phase->updated_at,
                        'deleted_at' => null,
                    ]);
                }
            });

        DB::table('permissions')->insertOrIgnore([
            'name' => 'Manage Project Milestones',
            'slug' => 'project.manage_milestones',
            'module' => 'project',
            'action' => 'manage_milestones',
            'description' => 'Manage project milestones',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(?string $value): array
    {
        if (! $value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function mapPhaseStatus(string $status): string
    {
        return match ($status) {
            'in_progress' => 'active',
            'completed' => 'completed',
            'overdue' => 'active',
            default => 'pending',
        };
    }

    private function mergeMilestonePermissionIntoPhasePermission(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $milestonePermissionId = DB::table('permissions')
            ->where('slug', 'project.manage_milestones')
            ->value('id');
        $phasePermissionId = DB::table('permissions')
            ->where('slug', 'project.manage_phases')
            ->value('id');

        if (! $milestonePermissionId || ! $phasePermissionId) {
            return;
        }

        if (Schema::hasTable('role_permissions')) {
            DB::table('role_permissions')
                ->where('permission_id', $milestonePermissionId)
                ->get()
                ->each(function (object $assignment) use ($phasePermissionId): void {
                    DB::table('role_permissions')->insertOrIgnore([
                        'role_id' => $assignment->role_id,
                        'permission_id' => $phasePermissionId,
                        'created_at' => $assignment->created_at,
                        'updated_at' => $assignment->updated_at,
                    ]);
                });
        }

        if (Schema::hasTable('user_permissions')) {
            DB::table('user_permissions')
                ->where('permission_id', $milestonePermissionId)
                ->where('granted', 'granted')
                ->get()
                ->each(function (object $assignment) use ($phasePermissionId): void {
                    DB::table('user_permissions')->insertOrIgnore([
                        'user_id' => $assignment->user_id,
                        'permission_id' => $phasePermissionId,
                        'granted' => 'granted',
                        'created_at' => $assignment->created_at,
                        'updated_at' => $assignment->updated_at,
                    ]);
                });
        }

        DB::table('permissions')->where('id', $milestonePermissionId)->delete();
    }
};
