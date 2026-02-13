export type UserId = string;

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
  
  findByEmail(email: string): Promise<User | null>;
  
  findAdminsByTenant(tenantId: string): Promise<User[]>;
  
  isUserAdmin(userId: UserId, tenantId: string): Promise<boolean>;
}
