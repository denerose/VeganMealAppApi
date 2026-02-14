export type UserId = string;

export type Tenant = {
  id: string;
  name: string;
};

export type User = {
  id: UserId;
  email: string;
  nickname: string;
  isTenantAdmin: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserRepository {
  findById(id: UserId, tenantId: string): Promise<User | null>;

  findTenantById(tenantId: string): Promise<Tenant | null>;

  findByEmail(email: string): Promise<User | null>;

  findAdminsByTenant(tenantId: string): Promise<User[]>;

  isUserAdmin(userId: UserId, tenantId: string): Promise<boolean>;

  /**
   * Finds a user by email including password hash for authentication.
   * @param email - Email address to lookup
   * @returns User with password hash, or null if not found
   */
  findByEmailWithPassword(
    email: string
  ): Promise<{ user: User; passwordHash: string | null } | null>;

  /**
   * Updates a user's password hash.
   * @param userId - User ID to update
   * @param passwordHash - New password hash (bcrypt)
   */
  updatePasswordHash(userId: UserId, passwordHash: string): Promise<void>;

  /**
   * Updates a user's nickname. Caller must ensure tenant isolation (userId belongs to tenantId).
   */
  updateNickname(userId: UserId, tenantId: string, nickname: string): Promise<User>;
}
