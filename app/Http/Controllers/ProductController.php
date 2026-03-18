<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    public function __construct()
    {
        // Using existing middleware approach
    }

    /**
     * Check if user has permission or is super admin
     */
    private function checkPermission($permission)
    {
        $user = User::find(Auth::user()->id);
        return $user->hasPermission($permission);
    }

    /**
     * Display a listing of products
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        // Super admins have access to everything
        if (!$this->checkPermission('product.read')) {
            abort(403, 'Insufficient permissions to view products.');
        }

        $query = Product::query();

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $products = $query->withCount('clients')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/products/Index', [
            'products' => $products,
            'filters' => $request->only(['status', 'search']),
            'userPermissions' => $user->getAllPermissions()->pluck('slug')
        ]);
    }

    /**
     * Show the form for creating a new product
     */
    public function create()
    {
        

        if (!$this->checkPermission('product.create')) {
            abort(403, 'Insufficient permissions to create products.');
        }

        return Inertia::render('admin/products/Create');
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        

        if (!$this->checkPermission('product.create')) {
            abort(403, 'Insufficient permissions to create products.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:products',
            'description' => 'nullable|string|max:1000',
            'version' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive,discontinued',
            'metadata' => 'nullable|array'
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'version' => $validated['version'] ?? null,
            'status' => $validated['status'],
            'metadata' => $validated['metadata'] ?? null,
        ]);

        // Log to notifications or create custom activity log
        $this->logActivity('Product created', $product);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        

        if (!$this->checkPermission('product.read')) {
            abort(403, 'Insufficient permissions to view product.');
        }

        return Inertia::render('admin/products/Show', [
            'product' => $product
        ]);
    }

    /**
     * Show the form for editing the specified product
     */
    public function edit(Product $product)
    {
        

        if (!$this->checkPermission('product.update')) {
            abort(403, 'Insufficient permissions to edit product.');
        }

        return Inertia::render('admin/products/Edit', [
            'product' => $product
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product)
    {
        

        if (!$this->checkPermission('product.update')) {
            abort(403, 'Insufficient permissions to update product.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:products,name,' . $product->id,
            'description' => 'nullable|string|max:1000',
            'version' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive,discontinued',
            'metadata' => 'nullable|array'
        ]);

        $product->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'version' => $validated['version'] ?? null,
            'status' => $validated['status'],
            'metadata' => $validated['metadata'] ?? null,
        ]);

        $this->logActivity('Product updated', $product);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product)
    {
        

        if (!$this->checkPermission('product.delete')) {
            abort(403, 'Insufficient permissions to delete product.');
        }

        $product->delete();

        $this->logActivity('Product deleted', $product);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    /**
     * Restore soft-deleted product.
     */
    public function restore(Product $product)
    {
        

        if (!$this->checkPermission('product.update')) {
            abort(403, 'Insufficient permissions to restore product.');
        }

        $product->restore();

        $this->logActivity('Product restored', $product);

        return redirect()->route('products.index')
            ->with('success', 'Product restored successfully.');
    }

    /**
     * Custom activity logging method
     */
    private function logActivity($action, $subject, $properties = [])
    {
        // For now, just create a notification entry
        Notification::create([
            'user_id' => Auth::id(),
            'title' => 'Product Activity',
            'message' => $action . ': ' . $subject->name,
            'type' => 'system',
            'is_read' => false,
            'data' => json_encode($properties)
        ]);
    }
}
