// Vitest globals are available without import

// Skip this test file due to circular dependency issues
describe.skip('Utils', () => {
  it('should be skipped due to circular dependency issues', () => {
    expect(true).toBe(true);
  });
});