import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';

export interface PlannedWeekRepository {
  create(plannedWeek: PlannedWeek): Promise<PlannedWeek>;
  save(plannedWeek: PlannedWeek): Promise<PlannedWeek>;
  findById(id: string, tenantId: string): Promise<PlannedWeek | null>;
  findByTenantAndStartDate(tenantId: string, startingDate: string): Promise<PlannedWeek | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
