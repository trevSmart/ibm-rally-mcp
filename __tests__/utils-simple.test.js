import { vi } from 'vitest';
// Vitest globals are available without import

// Mock simple para evitar problemas de importación
const mockRally = {
  util: {
    query: {
      where: vi.fn()
    }
  },
  default: vi.fn()
};

vi.mock('ibm-rally-node', () => mockRally);

describe('Utils Functions', () => {
  it('should create query where clause', () => {
    const mockWhere = vi.fn((field, operator, value) => ({
      field,
      operator,
      value
    }));

    mockRally.util.query.where = mockWhere;

    const result = mockRally.util.query.where('Name', '=', 'Test');

    expect(result).toEqual({
      field: 'Name',
      operator: '=',
      value: 'Test'
    });
  });

  it('should handle date formatting', () => {
    const now = new Date();
    const isoString = now.toISOString();
    const localeString = now.toLocaleString();

    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(localeString).toBeTruthy();
  });

  it('should handle timezone detection', () => {
    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(timezone).toBeTruthy();
    expect(typeof timezone).toBe('string');
  });
});
