import { describe, test } from 'bun:test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

describe('Eligible Meals API (contract)', () => {
  test.todo('returns meals matching daily preferences for lunch slots', () => {
    void API_BASE_URL;
  });

  test.todo('returns meals matching daily preferences for dinner slots', () => {});

  test.todo('returns empty list when no meals satisfy filters but allows manual assignment', () => {});
});
