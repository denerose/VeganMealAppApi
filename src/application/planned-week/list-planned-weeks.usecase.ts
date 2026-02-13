import type {
  PlannedWeekRepository,
  PlannedWeekFilters,
  PaginationOptions,
} from '@/domain/planned-week/planned-week.repository';
import type { PlannedWeekSnapshot } from '@/domain/planned-week/planned-week.entity';

export type ListPlannedWeeksRequest = {
  tenantId: string;
  filters?: PlannedWeekFilters;
  pagination?: PaginationOptions;
};

export type ListPlannedWeeksResponse = {
  items: PlannedWeekSnapshot[];
  total: number;
  limit: number;
  offset: number;
};

export class ListPlannedWeeksUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: ListPlannedWeeksRequest): Promise<ListPlannedWeeksResponse> {
    const result = await this.plannedWeekRepository.findAll(
      request.tenantId,
      request.filters,
      request.pagination
    );

    return {
      items: result.items.map(week => week.toSnapshot()),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }
}
