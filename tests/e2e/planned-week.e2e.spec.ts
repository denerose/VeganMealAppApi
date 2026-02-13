import { describe, test } from 'bun:test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

const plannedWeekPayload = {
  startingDate: '2025-01-06',
};

describe('Planned Weeks API (contract)', () => {
  test.todo('creates a planned week aligned to tenant weekStartDay', () => {
    void plannedWeekPayload;
    void API_BASE_URL;
  });

  test.todo('retrieves a planned week with 7 day plans and meal assignments', () => {});

  test.todo('assigns lunch and dinner meals via PATCH endpoint with leftovers recomputed', () => {});

  test.todo('deletes a planned week and returns 204 status', () => {});
});
