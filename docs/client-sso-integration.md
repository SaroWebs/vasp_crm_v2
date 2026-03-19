# Client SSO Authentication Integration Guide
**Example URL:**
```
https://domain.com/s/{CLIENT_CODE}?token={SSO_TOKEN}

example: https://domain.com/s/2325?token=v1.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Generation

Third-party applications must generate an encrypted token with the following payload:

```json
{
    "ClientCode": "2325",
    "ClientName": "ABC Comp",
    "ClientEmail": "abc@gmail.com",
    "ClientPhone": "999999999",
    "UserLogin": "usernameforlogin",
    "UserName": "John Doe",
    "UserPhone": "9556669999",
    "UserEmail": "johndoe@abc.com",
    "iat": 1699876543,
    "exp": 1699876843,
    "jti": "uuid-v4-string"
}
```

**Payload Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ClientCode` | string | Yes | Unique client identifier (must match the `client_code` query parameter) |
| `ClientName` | string | No | Client organization name (used for updates) |
| `ClientEmail` | string | No | Client email (used for updates) |
| `ClientPhone` | string | No | Client phone number (used for updates) |
| `UserLogin` | string | No | Username for login |
| `UserName` | string | Yes | User's full name |
| `UserPhone` | string | No | User's phone number |
| `UserEmail` | string | Yes | User's email address (used for user lookup/creation) |
| `iat` | integer | Yes | Issued at timestamp - Unix epoch |
| `exp` | integer | Yes | Expiration timestamp - Unix epoch, recommended: 5 minutes from iat |
| `jti` | string | Yes | Unique token identifier - UUID v4 |

### Token Encryption

The token must be encrypted using **AES-256-GCM** with the client's SSO secret key.

**Token Format:** `v1.{iv}.{ciphertext}.{tag}`

Where:

- `v1` - Version identifier
- `iv` - 12-byte initialization vector (base64url encoded)
- `ciphertext` - Encrypted payload (base64url encoded)
- `tag` - Authentication tag (base64url encoded)

### Client Configuration

Each client must be configured with:

- **Client Code:** Unique identifier (e.g., `CODE1234`)
- **SSO Secret:** Base64-encoded 32-byte AES-256 key

Contact your administrator to obtain the client code and SSO secret.

---

---
[Frontend Button]
        ↓
[Call Backend API]
        ↓
[Backend generates token]
        ↓
[Backend returns SSO URL]
        ↓
[Frontend opens URL]

## Integration Checklist

- [ ] Obtain client code from administrator
- [ ] Obtain SSO secret key from administrator
- [ ] Implement token encryption (AES-256-GCM)
- [ ] Generate unique JTI for each login attempt
- [ ] Set appropriate token expiration (recommended: 5 minutes)
- [ ] Handle redirect to SSO endpoint

---

## Error Handling

The SSO endpoint returns the following HTTP status codes:

| Status Code | Description                              |
| ----------- | ---------------------------------------- |
| 403         | SSO is disabled or secret not configured |
| 422         | Invalid or expired token                 |
| 404         | Client not found                         |



**PHP Example:**

```php
<?php

function generateSsoToken(array $payload, string $ssoSecret): string
{
    $key = base64_decode($ssoSecret, true);
    $iv = random_bytes(12);

    $tag = '';
    $ciphertext = openssl_encrypt(
        json_encode($payload),
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );

    return 'v1.'
        . base64url_encode($iv) . '.'
        . base64url_encode($ciphertext) . '.'
        . base64url_encode($tag);
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}
```

**Node.js Example:**

```javascript
const crypto = require('crypto');

function generateSsoToken(payload, ssoSecret) {
    const key = Buffer.from(ssoSecret, 'base64');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return 'v1.'
        + base64url(iv) + '.'
        + base64url(encrypted) + '.'
        + base64url(tag);
}

function base64url(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Usage - New Payload Format
const payload = {
    ClientCode: '2325',
    ClientName: 'ABC Comp',
    ClientEmail: 'abc@gmail.com',
    ClientPhone: '999999999',
    UserLogin: 'usernameforlogin',
    UserName: 'John Doe',
    UserPhone: '9556669999',
    UserEmail: 'johndoe@abc.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    jti: crypto.randomUUID()
};

const token = generateSsoToken(payload, 'YOUR_BASE64_ENCODED_SECRET');
console.log(token);
```

**C# (.NET) Example:**

```csharp
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public class SsoTokenGenerator
{
    public static string GenerateSsoToken(Dictionary<string, object> payload, string ssoSecret)
    {
        byte[] key = Convert.FromBase64String(ssoSecret);
        byte[] iv = new byte[12];
        RandomNumberGenerator.Fill(iv);

        string jsonPayload = JsonSerializer.Serialize(payload);
        byte[] plainBytes = Encoding.UTF8.GetBytes(jsonPayload);

        using var aes = new AesGcm(key, 16);
        byte[] cipherBytes = new byte[plainBytes.Length];
        byte[] tag = new byte[16];

        aes.Encrypt(iv, plainBytes, cipherBytes, tag);

        string token = $"v1.{Base64UrlEncode(iv)}.{Base64UrlEncode(cipherBytes)}.{Base64UrlEncode(tag)}";
        return token;
    }

    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}

// Usage - New Payload Format
var payload = new Dictionary<string, object>
{
    { "ClientCode", "2325" },
    { "ClientName", "ABC Comp" },
    { "ClientEmail", "abc@gmail.com" },
    { "ClientPhone", "999999999" },
    { "UserLogin", "usernameforlogin" },
    { "UserName", "John Doe" },
    { "UserPhone", "9556669999" },
    { "UserEmail", "johndoe@abc.com" },
    { "iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds() },
    { "exp", DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds() },
    { "jti", Guid.NewGuid().ToString() }
};

string token = SsoTokenGenerator.GenerateSsoToken(payload, "YOUR_BASE64_ENCODED_SECRET");
Console.WriteLine(token);
```

**Python Example:**

```python
import os
import base64
import json
import time
import uuid
from Crypto.Cipher import AES

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def generate_sso_token(payload, sso_secret):
    key = base64.b64decode(sso_secret)
    iv = os.urandom(12)
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(json.dumps(payload).encode('utf-8'))
    
    return f"v1.{base64url_encode(iv)}.{base64url_encode(ciphertext)}.{base64url_encode(tag)}"

# Usage - New Payload Format
payload = {
    'ClientCode': '2325',
    'ClientName': 'ABC Comp',
    'ClientEmail': 'abc@gmail.com',
    'ClientPhone': '999999999',
    'UserLogin': 'usernameforlogin',
    'UserName': 'John Doe',
    'UserPhone': '9556669999',
    'UserEmail': 'johndoe@abc.com',
    'iat': int(time.time()),
    'exp': int(time.time()) + 300,
    'jti': str(uuid.uuid4())
}

token = generate_sso_token(payload, 'YOUR_BASE64_ENCODED_SECRET')
print(token)
```
