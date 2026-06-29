<?php

namespace Tests\Feature;

use App\Http\Controllers\MonthlyCycleRuleController;
use App\Models\MonthlyCycleRule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MonthlyCycleOpMonthListTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_op_month_list_includes_current_cycle_and_excludes_future_cycles(): void
    {
        Carbon::setTestNow('2026-06-29 10:00:00');

        MonthlyCycleRule::create([
            'month_starts_on' => 21,
            'effective_from' => '2026-04-21',
            'include_gap_in_current' => true,
        ]);

        $response = app(MonthlyCycleRuleController::class)->listOpMonths(Request::create('/'));
        $data = $response->getData(true)['data'];

        $this->assertSame(
            ['2026-06-21', '2026-05-21', '2026-04-21'],
            array_column($data, 'start_date')
        );
        $this->assertSame('2026-07-20', $data[0]['end_date']);
        $this->assertNotContains('2026-07-21', array_column($data, 'start_date'));
    }
}
