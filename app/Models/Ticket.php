<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
	use SoftDeletes;

	protected $fillable = [
		'client_id',
		'organization_user_id',
		'ticket_number',
		'title',
		'description',
 		'category',
 		'priority',
 		'status',
 		'assigned_to',
 		'approved_by',
 	];

	/**
	 * Get the client that owns the ticket.
	 */
	public function client()
	{
		return $this->belongsTo(Client::class);
	}

	/**
	 * Get the organization user who created the ticket.
	 */
	public function organizationUser()
	{
		return $this->belongsTo(OrganizationUser::class, 'organization_user_id');
	}

	public function attachments()
	{
		return $this->hasMany(TicketAttachment::class, 'ticket_id');
	}


	public function assignedTo() {
		return $this->belongsTo(User::class, 'assigned_to');
	}

	public function approvedBy() {
		return $this->belongsTo(User::class, 'approved_by');
	}
	
	public function tasks() {
		return $this->hasMany(Task::class);
	}

	public function comments() {
		return $this->hasMany(TicketComment::class);
	}
}
