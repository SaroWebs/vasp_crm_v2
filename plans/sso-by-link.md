## SSO-by-Link Authentication + Client User Portal (Organization Users)

### Summary
Implement a new authentication flow where a client’s external admin panel links to our app (`A`) using a one-time, AES-256-GCM encrypted token. On success, we authenticate (session-based) an `organization_user` for the given `client` and redirect them to a client portal at `/c/{clientCode}` for **their own ticket CRUD + comments**.

---

### Key Changes (Backend)

#### 1) Data + Config
- **Clients**
  - Add `clients.sso_enabled` (`boolean`, default `false`).
  - Add `clients.sso_secret` (`text`, nullable) and store it **encrypted at rest** via an Eloquent `encrypted` cast.
  - Ensure `clients.code` is **unique** (unique index is OK even if nullable; MySQL allows multiple NULLs).
- **Organization Users identity**
  - Use **(client_id + email)** as the primary identity for SSO matching.
  - Add a **unique index** on `organization_users (client_id, email)` (and standardize to lowercase on save/update to avoid duplicates).
- **Replay protection**
  - Add `sso_login_tokens` table to enforce **one-time-use**:
    - `client_id`, `jti` (unique per client), `organization_user_id`, `expires_at`, `used_at`, `ip`, `user_agent`, timestamps.
    - Unique index: `(client_id, jti)`.

#### 2) Token Spec (what C1/C2 must generate)
- Link format: `GET /s/{clientCode}?token=...`
- Token format (versioned): `v1.{b64url(iv)}.{b64url(ciphertext)}.{b64url(tag)}`
- AES mode: **AES-256-GCM**
- Key: derived from `clients.sso_secret` (exact derivation documented in code; simplest is requiring a 32-byte base64 key from the client and decoding it).
- Decrypted JSON payload (required fields):
  - `email` (string)
  - `iat` (int unix seconds)
  - `exp` (int unix seconds)
  - `jti` (uuid/string, unique per login link)
- Optional fields (used to auto-provision/update profile): `name`, `designation`, `phone`
- Validation rules:
  - Route `{clientCode}` must match the client we resolve from DB.
  - `exp > now`, `iat <= now` with small clock-skew tolerance.
  - Reject if `(client_id, jti)` already exists (replay).
  - Reject if client `sso_enabled=false` or missing `sso_secret`.

#### 3) Authentication (Laravel guards)
- Add a new session guard + provider in `config/auth.php`:
  - Provider: `organization_users` -> `App\Models\OrganizationUser`
  - Guard: `organization` (session driver)
- Make `OrganizationUser` authenticatable (extend `Illuminate\Foundation\Auth\User` / implement Authenticatable contract). No password flow is needed; log in is only via SSO.

#### 4) Routes + Controllers
- **SSO entry**
  - `GET /s/{client:code}` → `ClientSsoController@consume`
    - Decrypt + validate token
    - Find/create org user by `(client_id, email)` (auto-provision enabled by default for SSO-enabled clients)
    - Record `jti` as used (one-time)
    - `Auth::guard('organization')->login($organizationUser)`
    - Redirect to `/c/{clientCode}` (or `/c/{clientCode}/tickets`)
- **Client portal**
  - Route group: `/c/{client:code}` protected by `auth:organization`
  - Add middleware that also enforces: logged-in org user’s `client_id` matches the `{client}` route param.
- **Ticket CRUD (scoped)**
  - Controllers + FormRequests dedicated to org users:
    - Index: only tickets where `client_id` and `organization_user_id` match the logged-in org user.
    - Store: create ticket + generate `ticket_number` using a shared `TicketNumberGenerator` service (reuse existing logic from admin controller).
    - Update/Delete rules (decision-locked to avoid ambiguity):
      - Update allowed only when `status=open` and `assigned_to` is null.
      - Delete = **soft delete** allowed only when `status=open` and `assigned_to` is null.
- **Comments**
  - Allow org users to add comments + attachments on their own tickets.
  - Ensure org users cannot set `is_internal=true`, and never see internal-only comments in portal responses.

#### 5) Inertia + React UI
- Add client-portal pages under `resources/js/pages/client/...`:
  - Tickets index, create/edit form, show page with comments.
- Reuse existing ticket/comment UI components where practical, but keep client portal scoped (no admin menus/permissions).
- Update `HandleInertiaRequests` shared props to detect `organization` guard and expose `auth.guard = 'organization'` and the org user + client basics.

---

### Test Plan (PHPUnit Feature tests)
- SSO consume:
  - Valid token logs in org user and redirects to `/c/{clientCode}`.
  - Expired token rejected.
  - Token replay (same `jti`) rejected.
  - Wrong clientCode (path vs payload/client secret) rejected.
  - Disabled client SSO rejected.
- Auto-provision:
  - First-time email creates `organization_user` (client-scoped), subsequent login updates name/phone fields.
- Portal authorization:
  - Org user cannot access another client’s `/c/{otherCode}`.
  - Org user cannot view/update/delete tickets not owned by them.
- Ticket rules:
  - Update/Delete allowed only while `open` and unassigned; denied otherwise.
- Comments:
  - Org user can comment on own ticket; cannot post internal comment; cannot access other users’ ticket comments.

---

### Assumptions (locked)
- Identity is **email** per client (unique by `(client_id, email)`).
- SSO tokens are **AES-256-GCM encrypted**, **one-time-use** via stored `jti`.
- Client portal is for **organization users only** and supports **ticket full CRUD + comments**, with update/delete restricted to `open` + unassigned.
- Client secrets are managed per client in DB (`clients.sso_secret`) and stored encrypted-at-rest.
