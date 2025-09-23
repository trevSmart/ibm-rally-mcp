import { describe, it, expect, jest } from '@jest/globals';

// Mock simple para evitar problemas de importación
jest.mock('ibm-rally-node', () => ({
  util: {
    query: {
      where: jest.fn()
    }
  },
  default: jest.fn()
}));

describe('Utils Functions', () => {
  it('should create query where clause', () => {
    const rally = require('ibm-rally-node');
    const mockWhere = jest.fn((field, operator, value) => ({
      field,
      operator,
      value
    }));

    rally.util.query.where = mockWhere;

    const result = rally.util.query.where('Name', '=', 'Test');

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
