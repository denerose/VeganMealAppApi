# Quick Start Guide: User Authentication API

**Feature**: User Authentication and Registration  
**Created**: 13 February 2026

This guide provides examples for using the authentication API endpoints.

---

## Prerequisites

- API server running on `http://localhost:3000`
- `curl` or HTTP client (Postman, Insomnia, etc.)
- Valid email address for testing

**Seed dev users**: After running `bun run db:seed`, you can sign in with 3 pre-created dev users. Emails and the shared password are in [SEEDING-GUIDE.md — Seed dev users](./SEEDING-GUIDE.md#seed-dev-users).

---

## 1. Register a New User

Create a new user account and tenant.

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vegan-chef@example.com",
    "password": "securePass123",
    "nickname": "Vegan Chef",
    "tenantName": "Smith Family"
  }'
```

**Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "vegan-chef@example.com",
    "nickname": "Vegan Chef",
    "tenantId": "123e4567-e89b-12d3-a456-426614174001",
    "tenantName": "Smith Family",
    "isTenantAdmin": true,
    "createdAt": "2026-02-13T10:00:00Z",
    "updatedAt": "2026-02-13T10:00:00Z"
  }
}
```

**Notes**:
- User automatically becomes tenant admin for newly created tenant
- Token is valid for 24 hours
- Save the token for subsequent authenticated requests

---

## 2. Login (Authenticate)

Authenticate with email and password to receive a new token.

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vegan-chef@example.com",
    "password": "securePass123"
  }'
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "vegan-chef@example.com",
    "nickname": "Vegan Chef",
    "tenantId": "123e4567-e89b-12d3-a456-426614174001",
    "tenantName": "Smith Family",
    "isTenantAdmin": true,
    "createdAt": "2026-02-13T10:00:00Z",
    "updatedAt": "2026-02-13T10:00:00Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Rate Limiting**:
- Limited to 3 attempts per 10 minutes per IP address
- Exceeding limit returns 429 Too Many Requests

**Calling other protected endpoints (meals, planned-weeks, etc.)**:
- Use the same token in every request: `Authorization: Bearer <token>`.
- Base URL for the API is `http://localhost:3000/api/v1`. For example, list meals: `GET http://localhost:3000/api/v1/meals` with header `Authorization: Bearer <token>`. If you use a variable like `{{baseUrl}}`, set it to `http://localhost:3000/api/v1` so that `{{baseUrl}}/meals` resolves to the correct path.

---

## 3. Get User Profile

Retrieve authenticated user's profile information.

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "vegan-chef@example.com",
  "nickname": "Vegan Chef",
  "tenantId": "123e4567-e89b-12d3-a456-426614174001",
  "tenantName": "Smith Family",
  "isTenantAdmin": true,
  "createdAt": "2026-02-13T10:00:00Z",
  "updatedAt": "2026-02-13T10:00:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

## 4. Update User Profile

Update user's nickname (email is immutable).

**Request**:
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Vegan Master Chef"
  }'
```

**Response** (200 OK):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "vegan-chef@example.com",
  "nickname": "Vegan Master Chef",
  "tenantId": "123e4567-e89b-12d3-a456-426614174001",
  "tenantName": "Smith Family",
  "isTenantAdmin": true,
  "createdAt": "2026-02-13T10:00:00Z",
  "updatedAt": "2026-02-13T10:05:00Z"
}
```

**Notes**:
- Email cannot be changed (immutable identifier)
- Only nickname can be updated

---

## 5. Change Password

Change password for authenticated user (requires current password).

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/password/change \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "securePass123",
    "newPassword": "newSecurePass456"
  }'
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
}
```

---

## 6. Request Password Reset

Request password reset email (rate limited).

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/password/reset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vegan-chef@example.com"
  }'
```

**Response** (200 OK):
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Notes**:
- Returns success message even if email doesn't exist (security best practice)
- Rate limited to 3 attempts per 10 minutes per IP address
- Reset token expires after 1 hour
- Check email for reset link

---

## 7. Reset Password

Reset password using token from email.

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "newPassword": "newSecurePass456"
  }'
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired reset token"
  }
}
```

**Notes**:
- Token is single-use (cannot be reused)
- Token expires after 1 hour
- After reset, user can login with new password

---

## Using Authentication Token

Include the JWT token in the `Authorization` header for all protected endpoints:

```bash
curl -X GET http://localhost:3000/api/v1/meals \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Token Format**:
```
Authorization: Bearer <jwt-token>
```

**Token Expiration**:
- Tokens expire after 24 hours
- Expired tokens return 401 Unauthorized
- User must login again to get new token

---

## Error Handling

### Common Error Codes

- **400 Bad Request**: Invalid request parameters (validation errors)
- **401 Unauthorized**: Invalid or expired token, invalid credentials
- **409 Conflict**: Email already registered
- **429 Too Many Requests**: Rate limit exceeded

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## Security Best Practices

1. **Store tokens securely**: Don't expose tokens in logs or client-side code
2. **Use HTTPS in production**: Always use HTTPS for authentication endpoints
3. **Handle token expiration**: Implement token refresh or re-authentication flow
4. **Rate limiting**: Respect rate limits to prevent account lockout
5. **Password security**: Use strong passwords (minimum 8 characters, letter + number)

---

## Integration Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Register
const registerResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'vegan-chef@example.com',
    password: 'securePass123',
    nickname: 'Vegan Chef',
    tenantName: 'Smith Family'
  })
});

const { token, user } = await registerResponse.json();

// Use token for authenticated requests
const mealsResponse = await fetch('http://localhost:3000/api/v1/meals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Python (requests)

```python
import requests

# Register
response = requests.post(
    'http://localhost:3000/api/v1/auth/register',
    json={
        'email': 'vegan-chef@example.com',
        'password': 'securePass123',
        'nickname': 'Vegan Chef',
        'tenantName': 'Smith Family'
    }
)

data = response.json()
token = data['token']

# Use token for authenticated requests
meals_response = requests.get(
    'http://localhost:3000/api/v1/meals',
    headers={'Authorization': f'Bearer {token}'}
)
```

---

## Testing Checklist

- [ ] Register new user with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Register with invalid password (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Login rate limiting (3 attempts per 10 minutes)
- [ ] Get profile with valid token
- [ ] Get profile with invalid token (should fail)
- [ ] Update profile nickname
- [ ] Change password with correct current password
- [ ] Change password with incorrect current password (should fail)
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with expired token (should fail)
- [ ] Reset password with used token (should fail)

---

## Next Steps

1. **Implement authentication**: Follow the implementation plan in `plan.md`
2. **Run tests**: Execute test suite to verify functionality
3. **Configure email service**: Set up SMTP for password reset emails
4. **Deploy**: Deploy authentication endpoints to production
5. **Monitor**: Monitor authentication events and rate limiting

For detailed implementation guidance, see `plan.md` and `data-model.md`.
