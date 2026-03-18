<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Client;

class Product extends Model
{
	use SoftDeletes;

	protected $guarded = [];

	protected function casts(): array
	{
		return [
			'metadata' => 'array',
		];
	}

    /**
     * Clients associated with this product.
     */
    public function clients()
    {
        return $this->hasMany(Client::class);
    }

}
