# Data Model Design: User Authentication

**Feature**: User Authentication and Registration  
**Created**: 13 February 2026  
**Database**: PostgreSQL 16  
**ORM**: Prisma 7.x

## Overview

This document defines the database schema extensions for user authentication and registration. The design extends the existing User model with password storage and adds a PasswordResetToken model for password recovery. All models maintain multi-tenant isolation via tenantId foreign keys.

---

## Schema Changes

### User Model Extension

**Changes**: Add `passwordHash` field to existing User model

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  nickname      String
  passwordHash  String?   // NEW: Hashed password (nullable for future OAuth users)
  isTenantAdmin Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdMeals  Meal[]    @relation("MealCreator")
  resetTokens   PasswordResetToken[] // NEW: Password reset tokens

  @@index([tenantId])
  @@index([email])
  @@map("users")
}
```

**Rationale**:
- `passwordHash`: Stores bcrypt-hashed password (nullable to support future OAuth users who don't have passwords)
- `resetTokens`: One-to-many relationship with PasswordResetToken for password recovery
- Existing indexes maintained for performance

---

### PasswordResetToken Model (NEW)

**Purpose**: Stores password reset tokens with expiration and usage tracking

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique // Cryptographically random token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime // Expiration timestamp (1 hour from creation)
  usedAt    DateTime? // Timestamp when token was used (null if unused)
  createdAt DateTime @default(now())

  @@index([token]) // Fast lookup by token
  @@index([userId]) // Find all tokens for a user
  @@index([expiresAt]) // Cleanup expired tokens
  @@map("password_reset_tokens")
}
```

**Fields**:
- `id`: Primary key (UUID)
- `token`: Unique cryptographically random token (used in reset URL)
- `userId`: Foreign key to User (cascade delete)
- `expiresAt`: Expiration timestamp (1 hour per specification)
- `usedAt`: Timestamp when token was used (null if unused, prevents reuse)
- `createdAt`: Audit timestamp

**Indexes**:
- `token`: Unique index for fast token lookup during reset
- `userId`: Index for finding all tokens for a user (cleanup/audit)
- `expiresAt`: Index for cleanup queries (delete expired tokens)

**Constraints**:
- Token must be unique (prevent collisions)
- Token expires after 1 hour
- Token can only be used once (usedAt prevents reuse)
- Cascade delete when user is deleted

---

## Entity Descriptions

### User (Extended)

**Purpose**: Represents an authenticated user in the system.

**New Fields**:
- `passwordHash`: Bcrypt-hashed password (nullable for future OAuth users)
- `resetTokens`: One-to-many relationship with PasswordResetToken

**Authentication Fields**:
- `email`: Unique identifier and login credential
- `passwordHash`: Secure password storage (bcrypt, cost factor 10)
- `nickname`: Display name (1-50 characters)

**Relationships**:
- One-to-many: PasswordResetToken (password recovery)
- One-to-many: Meal (created meals)
- Many-to-one: Tenant (belongs to tenant)

**Multi-Tenancy**:
- `tenantId`: Foreign key for tenant isolation
- All queries must filter by tenantId

---

### PasswordResetToken

**Purpose**: Represents a temporary, single-use credential for password recovery.

**Fields**:
- `token`: Cryptographically random token (used in reset URL)
- `userId`: Foreign key to User
- `expiresAt`: Expiration timestamp (1 hour from creation)
- `usedAt`: Timestamp when token was used (null if unused)

**Lifecycle**:
1. Created when user requests password reset
2. Expires after 1 hour
3. Marked as used when password is reset
4. Cannot be reused (usedAt prevents reuse)

**Security**:
- Token is cryptographically random (32+ bytes)
- Single-use (usedAt prevents reuse)
- Time-limited (expires after 1 hour)
- Scoped to user (userId foreign key)

---

## Migration Strategy

### Migration Steps

1. **Add passwordHash to User**:
   ```sql
   ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
   CREATE INDEX idx_users_email ON users(email); -- Already exists
   ```

2. **Create PasswordResetToken table**:
   ```sql
   CREATE TABLE password_reset_tokens (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     token VARCHAR(255) UNIQUE NOT NULL,
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at TIMESTAMP NOT NULL,
     used_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
   CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
   CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
   ```

3. **Data Migration**:
   - Existing users: `passwordHash` will be NULL (they need to set password on first login or via reset)
   - New users: `passwordHash` set during registration

---

## Validation Rules

### User Registration

- **Email**: 
  - Required, unique across all tenants
  - Valid email format
  - Maximum 255 characters (database constraint)

- **Password**:
  - Required for email/password registration
  - Minimum 8 characters
  - At least one letter and one number
  - Stored as bcrypt hash (cost factor 10)

- **Nickname**:
  - Required
  - Minimum 1 character
  - Maximum 50 characters

- **Tenant Name**:
  - Required for new tenant creation
  - Maximum 100 characters

### Password Reset Token

- **Token**:
  - Cryptographically random (32+ bytes)
  - Unique across all tokens
  - Used in reset URL

- **Expiration**:
  - Created with `expiresAt = createdAt + 1 hour`
  - Expired tokens cannot be used

- **Usage**:
  - Single-use only (usedAt prevents reuse)
  - Once used, token is invalidated

---

## Query Patterns

### User Authentication

```typescript
// Find user by email (for login)
const user = await prisma.user.findUnique({
  where: { email },
  include: { tenant: true }
});

// Verify password
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### Password Reset

```typescript
// Create reset token
const token = await prisma.passwordResetToken.create({
  data: {
    token: generateRandomToken(),
    userId: user.id,
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  }
});

// Find valid reset token
const resetToken = await prisma.passwordResetToken.findFirst({
  where: {
    token,
    expiresAt: { gt: new Date() },
    usedAt: null
  },
  include: { user: true }
});

// Mark token as used
await prisma.passwordResetToken.update({
  where: { id: resetToken.id },
  data: { usedAt: new Date() }
});
```

### Cleanup Expired Tokens

```typescript
// Delete expired tokens (run as scheduled job)
await prisma.passwordResetToken.deleteMany({
  where: {
    expiresAt: { lt: new Date() }
  }
});
```

---

## Multi-Tenancy Considerations

### Tenant Isolation

- All authentication queries must include tenantId filter
- User belongs to exactly one tenant
- Password reset tokens are scoped to user (implicitly scoped to tenant)
- JWT tokens include tenantId for request validation

### Tenant Creation

- New tenant created during user registration
- First user in tenant becomes tenant admin (`isTenantAdmin = true`)
- Tenant name provided during registration

---

## Performance Considerations

### Indexes

- `users.email`: Unique index for fast email lookup (login)
- `users.tenantId`: Index for tenant-scoped queries
- `password_reset_tokens.token`: Unique index for token lookup
- `password_reset_tokens.expiresAt`: Index for cleanup queries

### Query Optimization

- Email lookup uses unique index (O(log n))
- Token lookup uses unique index (O(log n))
- Tenant filtering uses tenantId index
- Expired token cleanup uses expiresAt index

---

## Security Considerations

### Password Storage

- Passwords never stored in plaintext
- Bcrypt hashing with cost factor 10
- Unique salt per password (bcrypt handles this)

### Token Security

- Cryptographically random tokens (32+ bytes)
- Single-use tokens (usedAt prevents reuse)
- Time-limited tokens (1 hour expiration)
- Tokens invalidated after use

### Multi-Tenant Security

- TenantId included in JWT token
- Middleware validates tenantId matches user's tenant
- Repository methods filter by tenantId
- Prevents cross-tenant access

---

## Future Extensibility

### OAuth/Social Auth Support

- `passwordHash` is nullable (OAuth users don't have passwords)
- Can add `authProvider` field to User model:
  ```prisma
  enum AuthProvider {
    EMAIL_PASSWORD
    OAUTH_GOOGLE
    OAUTH_GITHUB
    PASSKEY
  }
  
  model User {
    authProvider AuthProvider @default(EMAIL_PASSWORD)
    // ...
  }
  ```

### Passkey Support

- Can add `PasskeyCredential` model:
  ```prisma
  model PasskeyCredential {
    id        String   @id @default(uuid())
    userId    String
    user      User     @relation(fields: [userId], references: [id])
    credentialId String @unique
    publicKey String
    // WebAuthn fields
  }
  ```

This schema design supports current email/password authentication while maintaining flexibility for future authentication methods.
