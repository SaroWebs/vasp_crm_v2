<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SalesLeadController extends Controller
{
    public function adminIndex(): Response
    {
        return Inertia::render('admin/sales-leads/Index');
    }

    public function myIndex(): Response
    {
        return Inertia::render('my/sales-leads/Index');
    }
}
