# Research & Technical Decisions

**Feature**: User Authentication and Registration  
**Created**: 13 February 2026  
**Purpose**: Document research findings and technical decisions for authentication implementation

## Authentication Architecture Strategy

**Decision**: Extensible Authentication Provider Pattern (Strategy Pattern)

**Rationale**:
- User requirement: "for development purposes let's set up our own auth but allow for extension later including use of external auth, social auth, and passkeys"
- Strategy pattern enables adding new authentication methods without modifying core authentication flow
- Clean Architecture compliance: domain defines interface, infrastructure implements providers
- Testability: use cases can be tested with mock providers
- Single Responsibility: each provider handles one authentication method

**Architecture**:
```typescript
// Domain interface
interface AuthProvider {
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;
  register(data: RegistrationData): Promise<AuthResult>;
}

// Infrastructure implementations
class EmailPasswordAuthProvider implements AuthProvider { ... }
class OAuthAuthProvider implements AuthProvider { ... } // Future
class PasskeyAuthProvider implements AuthProvider { ... } // Future
```

**Alternatives Considered**:
- **Direct implementation**: Rejected - would require refactoring when adding new auth methods
- **Plugin system**: Rejected - over-engineered for current needs, strategy pattern sufficient
- **External auth service**: Rejected - user wants own auth for development, external service adds complexity

---

## Password Hashing

**Decision**: bcrypt with cost factor 10

**Rationale**:
- Industry standard for password hashing
- Built-in salt generation (unique salt per password)
- Adaptive cost factor allows increasing security over time
- Well-tested and secure against rainbow table attacks
- Async operations prevent blocking event loop

**Configuration**:
- Cost factor: 10 (balance between security and performance)
- Async hashing: `bcrypt.hash()` and `bcrypt.compare()` are async
- Password requirements: Minimum 8 characters, at least one letter and one number

**Alternatives Considered**:
- **Argon2**: Considered - more modern, but bcrypt is sufficient for current needs and more widely supported
- **scrypt**: Considered - good option, but bcrypt has better library support in Node.js/Bun ecosystem
- **PBKDF2**: Rejected - older standard, bcrypt preferred for new implementations

**Reference**: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

## JWT Token Implementation

**Decision**: jsonwebtoken library with RS256 (RSA) or HS256 (HMAC) signing

**Rationale**:
- Standard JWT implementation for Node.js/Bun
- Supports both symmetric (HS256) and asymmetric (RS256) signing
- Token payload includes: userId, tenantId, email, iat, exp
- 24-hour expiration per specification
- Stateless authentication (no server-side session storage required)

**Token Structure**:
```typescript
{
  userId: string;
  tenantId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration (24 hours)
}
```

**Signing Algorithm**:
- Development: HS256 (symmetric, simpler setup)
- Production: RS256 (asymmetric, better for distributed systems)

**Alternatives Considered**:
- **Session-based auth**: Rejected - requires server-side storage, less scalable
- **Opaque tokens**: Rejected - JWT provides stateless authentication, better for API
- **Custom token format**: Rejected - JWT is standard, well-supported, and secure

**Reference**: [JWT.io](https://jwt.io/)

---

## Rate Limiting

**Decision**: rate-limiter-flexible library with in-memory store

**Rationale**:
- Flexible rate limiting library supporting multiple strategies
- In-memory store sufficient for single-instance deployment
- Supports IP-based limiting (3 attempts per 10 minutes per IP)
- Can be extended to Redis for distributed rate limiting later
- Prevents brute force attacks on authentication endpoints

**Configuration**:
- Login endpoint: 3 attempts per 10 minutes per IP
- Password reset endpoint: 3 attempts per 10 minutes per IP
- Registration endpoint: 5 attempts per 15 minutes per IP (less strict)

**Alternatives Considered**:
- **express-rate-limit**: Considered - simpler but less flexible
- **Custom implementation**: Rejected - rate-limiter-flexible is well-tested and feature-rich
- **Redis-based**: Deferred - in-memory sufficient for MVP, can migrate to Redis later

**Reference**: [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible)

---

## Email Delivery

**Decision**: nodemailer with SMTP transport

**Rationale**:
- Standard email library for Node.js/Bun
- Supports multiple transports (SMTP, SendGrid, AWS SES, etc.)
- Flexible configuration via environment variables
- Password reset emails require reliable delivery
- Can be configured with any SMTP provider (Gmail, SendGrid, AWS SES, etc.)

**Configuration**:
- Transport: SMTP (configurable via environment variables)
- Password reset email: HTML template with reset link
- Reset link expiration: 1 hour per specification
- Email delivery timeout: 60 seconds per success criteria

**Alternatives Considered**:
- **SendGrid SDK**: Considered - good option but adds vendor lock-in
- **AWS SES SDK**: Considered - good option but adds vendor lock-in
- **Direct SMTP**: Chosen - nodemailer provides flexibility to switch providers

**Reference**: [nodemailer](https://nodemailer.com/)

---

## Password Reset Token Storage

**Decision**: Database table with expiration timestamp

**Rationale**:
- Secure token generation (cryptographically random)
- Single-use tokens (marked as used after reset)
- Expiration tracking (1 hour per specification)
- Audit trail (when reset was requested and completed)
- Multi-tenant support (tokens scoped to user/tenant)

**Schema**:
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

**Alternatives Considered**:
- **JWT-based reset tokens**: Considered - simpler but harder to revoke/invalidate
- **In-memory storage**: Rejected - lost on server restart, no audit trail
- **External token service**: Rejected - adds complexity, database sufficient

---

## Authentication Middleware

**Decision**: JWT validation middleware with HttpContext extension

**Rationale**:
- Existing HttpContext pattern already in place
- Middleware validates JWT and extracts userId/tenantId
- Extends HttpContext with authenticated user information
- Reusable across all protected endpoints
- Follows existing middleware pattern

**Implementation**:
```typescript
export const authMiddleware: HttpMiddleware = async (context: HttpContext) => {
  const token = extractTokenFromHeader(context.request);
  const payload = await validateJWT(token);
  return {
    ...context,
    userId: payload.userId,
    tenantId: payload.tenantId,
  };
};
```

**Alternatives Considered**:
- **Per-endpoint validation**: Rejected - violates DRY, middleware is cleaner
- **Decorator pattern**: Considered - middleware approach matches existing codebase patterns
- **Guard classes**: Considered - middleware simpler and consistent with existing code

---

## Multi-Tenant Authentication

**Decision**: Tenant ID included in JWT token and validated on every request

**Rationale**:
- Existing multi-tenant architecture uses tenantId for isolation
- Token includes tenantId to prevent cross-tenant access
- Middleware validates tenantId matches authenticated user's tenant
- Consistent with existing tenant isolation pattern
- No additional database queries for tenant validation

**Security**:
- Token includes tenantId from user's current tenant
- Middleware ensures tenantId matches user's tenant
- Repository methods already filter by tenantId
- Prevents token reuse across tenants

**Alternatives Considered**:
- **Tenant lookup on each request**: Rejected - adds database query overhead
- **Separate tokens per tenant**: Rejected - unnecessary complexity
- **Tenant in token**: Chosen - efficient and secure

---

## Error Handling & Security

**Decision**: Generic error messages to prevent user enumeration

**Rationale**:
- Security best practice: don't reveal if email exists
- Generic "Invalid credentials" message for failed login
- Prevents attackers from discovering valid email addresses
- Consistent error format across authentication endpoints
- Rate limiting prevents brute force attacks

**Error Messages**:
- Login failure: "Invalid email or password" (generic)
- Registration duplicate email: "Email already registered" (acceptable - registration is public)
- Invalid token: "Invalid or expired token"
- Rate limit exceeded: "Too many attempts. Please try again later."

**Alternatives Considered**:
- **Detailed error messages**: Rejected - security risk, reveals user information
- **Email-specific errors**: Rejected - enables user enumeration attacks
- **Generic errors**: Chosen - secure and user-friendly

---

## Future Extensibility

**Decision**: AuthProvider interface enables OAuth, social auth, and passkeys

**Architecture for Future Extensions**:

1. **OAuth Provider**:
```typescript
class OAuthAuthProvider implements AuthProvider {
  async authenticate(credentials: OAuthCredentials): Promise<AuthResult> {
    // OAuth flow implementation
  }
}
```

2. **Social Auth Provider**:
```typescript
class SocialAuthProvider implements AuthProvider {
  async authenticate(credentials: SocialCredentials): Promise<AuthResult> {
    // Google/Facebook/etc. OAuth implementation
  }
}
```

3. **Passkey Provider**:
```typescript
class PasskeyAuthProvider implements AuthProvider {
  async authenticate(credentials: PasskeyCredentials): Promise<AuthResult> {
    // WebAuthn/FIDO2 implementation
  }
}
```

**Migration Path**:
- Current: EmailPasswordAuthProvider registered in DI container
- Future: Additional providers registered, use cases support multiple providers
- User can choose authentication method during registration/login
- Backward compatible: existing email/password users continue to work

**Reference**: [WebAuthn Guide](https://webauthn.guide/), [OAuth 2.0](https://oauth.net/2/)
