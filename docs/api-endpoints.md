# API Reference

**Base URL:** `https://work.vasptechnologies.com`
**Authentication:** All requests require the header `X-Webhook-Password: 123`

---

## GET `/api/get_categories`

Returns a list of all available categories.

### Request Headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Webhook-Password` | `123` |

### Example Request

```bash
curl https://work.vasptechnologies.com/api/get_categories \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Password: 123'
```

### Example Response

```json
{
  "data": [
    {
      "CategoryId": 1,
      "CategoryName": "staff",
      "ApplicableTo": "staff",
      "DisplayNo": 1,
      "Status": 1
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `CategoryId` | integer | Unique category identifier |
| `CategoryName` | string | Name of the category |
| `ApplicableTo` | string | Entity type this category applies to |
| `DisplayNo` | integer | Display ordering index |
| `Status` | integer | `1` = active, `0` = inactive |

---

## POST `/api/get_employees`

Returns a list of employees belonging to a given category.

### Request Headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Webhook-Password` | `123` |

### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `CategoryName` | string | ✓ | Name of the category to filter employees by |

### Example Request

```bash
curl -X POST https://work.vasptechnologies.com/api/get_employees \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Password: 123' \
  -d '{"CategoryName": "staff"}'
```

### Example Response

```json
{
  "data": [
    { "code": "85",   "Name": "Sarowar Alam" },
    { "code": "165",  "Name": "Ritupan Deka" },
    ...
  ]
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `code` | string | Unique employee code |
| `Name` | string | Full name of the employee |