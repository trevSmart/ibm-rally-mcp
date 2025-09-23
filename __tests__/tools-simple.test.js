import { describe, it, expect } from '@jest/globals';

describe('Tool Functions', () => {
  it('should format current date correctly', () => {
    const now = new Date();

    const result = {
      now,
      nowLocaleString: now.toLocaleString(),
      nowIsoString: now.toISOString(),
      timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    expect(result.now).toBeInstanceOf(Date);
    expect(result.nowLocaleString).toBeTruthy();
    expect(result.nowIsoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.timezone).toBeTruthy();
  });

  it('should handle JSON stringification', () => {
    const testData = {
      name: 'Test Project',
      description: 'Test Description',
      state: 'Active'
    };

    const jsonString = JSON.stringify(testData, null, '\t');
    expect(jsonString).toContain('Test Project');
    expect(jsonString).toContain('Test Description');
    expect(jsonString).toContain('Active');
  });

  it('should handle error formatting', () => {
    const error = new Error('Test error');
    const errorMessage = `Error en getCurrentDate: ${error.message}`;

    expect(errorMessage).toBe('Error en getCurrentDate: Test error');
  });
});
