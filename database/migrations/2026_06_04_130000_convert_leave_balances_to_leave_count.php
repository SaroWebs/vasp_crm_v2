<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('leave_balances', 'opening_leaves')) {
            Schema::table('leave_balances', function (Blueprint $table) {
                $table->integer('opening_leaves')->default(0)->after('year');
            });
        }

        if (! Schema::hasColumn('leave_balances', 'assigned_leaves')) {
            Schema::table('leave_balances', function (Blueprint $table) {
                $table->integer('assigned_leaves')->default(0)->after('opening_leaves');
            });
        }

        if (! Schema::hasColumn('leave_balances', 'consumed_leaves')) {
            Schema::table('leave_balances', function (Blueprint $table) {
                $table->integer('consumed_leaves')->default(0)->after('assigned_leaves');
            });
        }

        if (! Schema::hasColumn('leave_balances', 'remaining_leaves')) {
            Schema::table('leave_balances', function (Blueprint $table) {
                $table->integer('remaining_leaves')->default(0)->after('consumed_leaves');
            });
        }

        if (Schema::hasColumn('leave_balances', 'opening_balance')) {
            DB::table('leave_balances')
                ->select(['id', 'opening_balance', 'allocated_hours', 'used_hours', 'closing_balance'])
                ->orderBy('id')
                ->chunkById(100, function ($balances): void {
                    foreach ($balances as $balance) {
                        DB::table('leave_balances')
                            ->where('id', $balance->id)
                            ->update([
                                'opening_leaves' => (int) floor(((float) $balance->opening_balance) / 8),
                                'assigned_leaves' => (int) floor(((float) $balance->allocated_hours) / 8),
                                'consumed_leaves' => (int) floor(((float) $balance->used_hours) / 8),
                                'remaining_leaves' => (int) floor(((float) $balance->closing_balance) / 8),
                            ]);
                    }
                });

            Schema::table('leave_balances', function (Blueprint $table) {
                $table->dropColumn(['opening_balance', 'allocated_hours', 'used_hours', 'closing_balance']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('leave_balances', function (Blueprint $table) {
            $table->decimal('opening_balance', 10, 2)->default(0)->after('year');
            $table->decimal('allocated_hours', 10, 2)->default(0)->after('opening_balance');
            $table->decimal('used_hours', 10, 2)->default(0)->after('allocated_hours');
            $table->decimal('closing_balance', 10, 2)->default(0)->after('used_hours');
        });

        DB::statement('UPDATE leave_balances SET opening_balance = opening_leaves * 8, allocated_hours = assigned_leaves * 8, used_hours = consumed_leaves * 8, closing_balance = remaining_leaves * 8');

        Schema::table('leave_balances', function (Blueprint $table) {
            $table->dropColumn(['opening_leaves', 'assigned_leaves', 'consumed_leaves', 'remaining_leaves']);
        });
    }
};
