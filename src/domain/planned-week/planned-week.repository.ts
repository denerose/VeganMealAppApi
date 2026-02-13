import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';

export type PlannedWeekFilters = {
  startDate?: string; // Filter weeks starting on or after this date (YYYY-MM-DD)
  endDate?: string; // Filter weeks starting on or before this date (YYYY-MM-DD)
};

export type PaginationOptions = {
  limit: number;
  offset: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export interface PlannedWeekRepository {
  create(plannedWeek: PlannedWeek): Promise<PlannedWeek>;
  save(plannedWeek: PlannedWeek): Promise<PlannedWeek>;
  findById(id: string, tenantId: string): Promise<PlannedWeek | null>;
  findByTenantAndStartDate(tenantId: string, startingDate: string): Promise<PlannedWeek | null>;
  findAll(
    tenantId: string,
    filters?: PlannedWeekFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PlannedWeek>>;
  delete(id: string, tenantId: string): Promise<void>;
}
