# Ticket Management API Contracts

This document describes the external ticket management API implemented in this project. It is based on the current code in `routes/api.php`, `app/Http/Middleware/ClientApiAuth.php`, and `app/Http/Controllers/ClientTicketController.php`.

## Base URL

```text
https://your-domain.com/api
```

There is no `/v1` prefix in the current route file.

## Authentication

All endpoints in this document use the `client.api` middleware.

### Required inputs

- `client_code`
- `X-API-KEY` header if `CLIENT_API_REQUIRE_KEY=true`

### Authentication rules

- Header-based API key: `X-API-KEY: your-api-key`
- Query-string fallback is also supported: `?api_key=your-api-key`
- `client_code` may be sent either as query param or request body field
- `client_code` is matched against `client_product_instances.code`
- The middleware resolves:
  - `authenticated_client`
  - `product_instance`

### Auth failure responses

Invalid API key:

```json
{
  "message": "Unauthorized. Invalid API_KEY."
}
```

Missing client code:

```json
{
  "message": "client_code is required."
}
```

Unknown client code:

```json
{
  "message": "No client found for the given client_code."
}
```

## Common Models In Responses

### Ticket

Typical ticket payloads include fields from `tickets` plus loaded relationships:

```json
{
  "id": 15,
  "client_id": 3,
  "client_product_instance_id": 21,
  "ticket_number": "acme-2026-03-09-10:30-001",
  "title": "Login page fails after deployment",
  "description": "Users receive a 500 error on submit.",
  "priority": "high",
  "category": "technical",
  "status": "open",
  "assigned_to": null,
  "approved_by": null,
  "created_at": "2026-03-09T10:30:00.000000Z",
  "updated_at": "2026-03-09T10:30:00.000000Z",
  "client_product_instance": {
    "id": 21,
    "product_id": 4,
    "client_id": 3,
    "code": "CLI-ERP-001",
    "instance_name": "ERP Production",
    "variant_name": "Primary",
    "deployment_status": "active",
    "product": {
      "id": 4,
      "name": "ERP Suite",
      "version": "2.3.1"
    }
  },
  "attachments": []
}
```

### Allowed enum values

Priority:

- `low`
- `medium`
- `high`
- `critical`

Category:

- `technical`
- `billing`
- `general`
- `support`

Status used by client API flows:

- `open`
- `approved`
- `in-progress`
- `closed`
- `cancelled`

Note: update and delete operations only allow tickets that are still `open`.

## Endpoints

### 1. Get Client Details

```http
GET /api/client/details?client_code={client_code}
X-API-KEY: your-api-key
```

Returns the resolved client, its product instances, and UI-friendly category / priority option lists.

#### Success response

```json
{
  "message": "Client details and products retrieved successfully.",
  "client": {
    "id": 3,
    "name": "Acme Ltd"
  },
  "projects": [
    {
      "id": 21,
      "client_id": 3,
      "product_id": 4,
      "code": "CLI-ERP-001",
      "instance_name": "ERP Production",
      "variant_name": "Primary",
      "deployment_status": "active",
      "product": {
        "id": 4,
        "name": "ERP Suite",
        "version": "2.3.1"
      }
    }
  ],
  "categories": [
    {
      "label": "Technical",
      "value": "technical"
    }
  ],
  "priorities": [
    {
      "label": "Low",
      "value": "low"
    }
  ]
}
```

### 2. List Tickets

```http
GET /api/tickets?client_code={client_code}&per_page=10
X-API-KEY: your-api-key
```

#### Query parameters

- `client_code` required
- `per_page` optional, default `10`

#### Success response

```json
{
  "message": "Tickets retrieved successfully.",
  "tickets": {
    "current_page": 1,
    "data": [
      {
        "id": 15,
        "ticket_number": "acme-2026-03-09-10:30-001",
        "title": "Login page fails after deployment",
        "priority": "high",
        "category": "technical",
        "status": "open",
        "attachments": []
      }
    ],
    "first_page_url": "https://your-domain.com/api/tickets?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "https://your-domain.com/api/tickets?page=1",
    "links": [],
    "next_page_url": null,
    "path": "https://your-domain.com/api/tickets",
    "per_page": 10,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

### 3. Create Ticket

```http
POST /api/tickets
X-API-KEY: your-api-key
Content-Type: multipart/form-data
```

This endpoint auto-generates the ticket number on the server.

#### Request fields

- `client_code` required
- `client_product_instance_id` required, integer, must belong to resolved client
- `title` required, string, max `255`
- `description` nullable, string
- `priority` required, one of `low|medium|high|critical`
- `category` required, one of `technical|billing|general|support`
- `attachments[]` optional files

#### Example request

```text
client_code=CLI-ERP-001
client_product_instance_id=21
title=Login page fails after deployment
description=Users receive a 500 error on submit.
priority=high
category=technical
attachments[]=error-screenshot.png
```

#### Success response

```json
{
  "message": "Ticket created successfully.",
  "data": {
    "id": 15,
    "ticket_number": "acme-2026-03-09-10:30-001",
    "title": "Login page fails after deployment",
    "description": "Users receive a 500 error on submit.",
    "priority": "high",
    "category": "technical",
    "status": "open"
  }
}
```

#### Validation / business-rule errors

Selected product does not belong to client:

```json
{
  "message": "Selected product does not belong to your account.",
  "data": null
}
```

Laravel validation errors use HTTP `422` with the standard validation error structure.

### 4. Update Ticket

```http
PUT /api/tickets/{ticket}
X-API-KEY: your-api-key
Content-Type: multipart/form-data
```

#### Request fields

- `client_code` required
- `client_product_instance_id` required, integer, must belong to resolved client
- `title` required, string, max `255`
- `description` nullable, string
- `priority` required, one of `low|medium|high|critical`
- `category` required, one of `technical|billing|general|support`
- `attachments[]` optional files to append

#### Rules

- The ticket must belong to the resolved client
- Only tickets with status `open` can be updated

#### Success response

```json
{
  "message": "Ticket updated successfully.",
  "data": {
    "id": 15,
    "ticket_number": "acme-2026-03-09-10:30-001",
    "title": "Login page fails after deployment",
    "priority": "critical",
    "category": "technical",
    "status": "open",
    "attachments": []
  }
}
```

#### Error responses

Unauthorized client/ticket mismatch:

```json
{
  "message": "Unauthorized."
}
```

Ticket is not open:

```json
{
  "message": "Ticket cannot be updated because it is no longer open.",
  "data": null
}
```

Wrong product instance:

```json
{
  "message": "Selected product does not belong to your account.",
  "data": null
}
```

### 5. Delete Ticket

```http
DELETE /api/tickets/{ticket}?client_code={client_code}
X-API-KEY: your-api-key
```

#### Rules

- The ticket must belong to the resolved client
- Only tickets with status `open` can be deleted
- Deletion is soft delete

#### Success response

```json
{
  "message": "Ticket deleted successfully.",
  "data": null
}
```

#### Error responses

Unauthorized client/ticket mismatch:

```json
{
  "message": "Unauthorized."
}
```

Ticket is not open:

```json
{
  "message": "Ticket cannot be deleted because it is no longer open.",
  "data": null
}
```

### 6. Remove Ticket Attachment

```http
DELETE /api/tickets/attachments/{attachment}?client_code={client_code}
X-API-KEY: your-api-key
```

#### Rules

- The attachment's ticket must belong to the resolved client
- The attachment can only be removed while the ticket status is `open`

#### Success response

```json
{
  "message": "Attachment removed successfully."
}
```

#### Error responses

Unauthorized client/ticket mismatch:

```json
{
  "message": "Unauthorized."
}
```

Ticket is not open:

```json
{
  "message": "Attachment cannot be removed because the ticket is no longer open."
}
```

## HTTP Status Codes Used

- `200 OK` successful read, update, delete, attachment removal
- `201 Created` successful ticket creation
- `401 Unauthorized` invalid or missing API key when required
- `404 Not Found` invalid `client_code` resolution
- `422 Unprocessable Entity` validation failure or business rule failure
- `500 Internal Server Error` unhandled server-side failure

## Implementation Notes

- Pagination size defaults to `10`
- API key enforcement is controlled by `CLIENT_API_REQUIRE_KEY`
- API key value is read from `CLIENT_API_KEY`
- `client_code` resolves through `client_product_instances.code`, not directly from the client record
- Ticket numbers are server-generated by `createApiTicket()`
- File uploads are handled through multipart requests

## Route Summary

```text
GET    /api/client/details
GET    /api/tickets
POST   /api/tickets
PUT    /api/tickets/{ticket}
DELETE /api/tickets/{ticket}
DELETE /api/tickets/attachments/{attachment}
```
