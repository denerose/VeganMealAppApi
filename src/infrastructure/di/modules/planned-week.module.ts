import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { CreatePlannedWeekUseCase } from '@/application/planned-week/create-planned-week.use-case';
import { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.use-case';
import { DeletePlannedWeekUseCase } from '@/application/planned-week/delete-planned-week.use-case';
import { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.use-case';
import { PopulateLeftoversUseCase } from '@/application/planned-week/populate-leftovers.use-case';
import { ListPlannedWeeksUseCase } from '@/application/planned-week/list-planned-weeks.use-case';
import { PlannedWeekController } from '@/infrastructure/http/controllers/planned-week.controller';
import { DayPlanController } from '@/infrastructure/http/controllers/day-plan.controller';

export function registerPlannedWeekModule(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(
    TOKENS.CreatePlannedWeekUseCase,
    c => new CreatePlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.GetPlannedWeekUseCase,
    c => new GetPlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.ListPlannedWeeksUseCase,
    c => new ListPlannedWeeksUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.DeletePlannedWeekUseCase,
    c => new DeletePlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.AssignMealToDayUseCase,
    c => new AssignMealToDayUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.PopulateLeftoversUseCase,
    c => new PopulateLeftoversUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.PlannedWeekController,
    c =>
      new PlannedWeekController(
        c.resolve(TOKENS.CreatePlannedWeekUseCase),
        c.resolve(TOKENS.GetPlannedWeekUseCase),
        c.resolve(TOKENS.DeletePlannedWeekUseCase),
        c.resolve(TOKENS.PopulateLeftoversUseCase),
        c.resolve(TOKENS.ListPlannedWeeksUseCase)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.DayPlanController,
    c =>
      new DayPlanController(
        c.resolve(TOKENS.AssignMealToDayUseCase),
        c.resolve(TOKENS.GetPlannedWeekUseCase)
      ),
    { singleton: true }
  );
}
