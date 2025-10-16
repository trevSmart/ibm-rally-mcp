import { vi } from 'vitest';
// Vitest globals are available without import

// Mock the Rally API
const mockCreate = vi.fn();

vi.mock('../src/utils.js', () => ({
	getRallyApi: vi.fn(() => ({
		create: mockCreate
	}))
}));

vi.mock('../index.js', () => ({
	log: vi.fn(),
	rallyData: {
		defaultProject: {
			ObjectID: '/project/12345'
		}
	}
}));

describe('createTestCase', () => {
	let createTestCase;

	beforeEach(async () => {
		vi.clearAllMocks();
		const module = await import('../src/tools/createTestCase.js');
		createTestCase = module.createTestCase;
	});

	describe('WorkProduct validation', () => {
		it('should accept user story reference with /hierarchicalrequirement/', async () => {
			mockCreate.mockResolvedValue({
				Object: {
					FormattedID: 'TC123',
					Name: 'Test Case',
					_ref: '/testcase/123'
				}
			});

			const testCase = {
				Name: 'Test Case',
				WorkProduct: '/hierarchicalrequirement/12345',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBeUndefined();
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'testcase',
					data: expect.objectContaining({
						WorkProduct: '/hierarchicalrequirement/12345'
					})
				})
			);
		});

		it('should accept defect reference with /defect/', async () => {
			mockCreate.mockResolvedValue({
				Object: {
					FormattedID: 'TC124',
					Name: 'Test Case for Defect',
					_ref: '/testcase/124'
				}
			});

			const testCase = {
				Name: 'Test Case for Defect',
				WorkProduct: '/defect/82742517605',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBeUndefined();
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'testcase',
					data: expect.objectContaining({
						WorkProduct: '/defect/82742517605'
					})
				})
			);
		});

		it('should reject invalid WorkProduct reference', async () => {
			const testCase = {
				Name: 'Test Case',
				WorkProduct: '/invalid/12345',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Invalid WorkProduct reference');
		});

		it('should support backward compatibility with UserStory field', async () => {
			mockCreate.mockResolvedValue({
				Object: {
					FormattedID: 'TC125',
					Name: 'Test Case with UserStory field',
					_ref: '/testcase/125'
				}
			});

			const testCase = {
				Name: 'Test Case with UserStory field',
				UserStory: '/hierarchicalrequirement/12345', // Old field name
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBeUndefined();
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'testcase',
					data: expect.objectContaining({
						WorkProduct: '/hierarchicalrequirement/12345'
					})
				})
			);
		});

		it('should prefer WorkProduct over UserStory when both are provided', async () => {
			mockCreate.mockResolvedValue({
				Object: {
					FormattedID: 'TC126',
					Name: 'Test Case with both fields',
					_ref: '/testcase/126'
				}
			});

			const testCase = {
				Name: 'Test Case with both fields',
				WorkProduct: '/defect/12345', // Should use this
				UserStory: '/hierarchicalrequirement/54321', // Should ignore this
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBeUndefined();
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'testcase',
					data: expect.objectContaining({
						WorkProduct: '/defect/12345'
					})
				})
			);
		});

		it('should error when neither WorkProduct nor UserStory is provided', async () => {
			const testCase = {
				Name: 'Test Case without WorkProduct',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('WorkProduct (or UserStory for backward compatibility)');
		});
	});

	describe('Required fields validation', () => {
		it('should validate Name field is required', async () => {
			const testCase = {
				WorkProduct: '/defect/12345',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('missing required fields');
			expect(result.content[0].text).toContain('Name');
		});

		it('should validate Project field is required', async () => {
			const testCase = {
				Name: 'Test Case',
				WorkProduct: '/defect/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('missing required fields');
			expect(result.content[0].text).toContain('Project');
		});

		it('should validate TestFolder field is required', async () => {
			const testCase = {
				Name: 'Test Case',
				WorkProduct: '/defect/12345',
				Project: '/project/12345',
				Owner: '/user/12345',
				Steps: []
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('missing required fields');
			expect(result.content[0].text).toContain('TestFolder');
		});
	});

	describe('Test case creation with steps', () => {
		it('should create test case with steps for defect', async () => {
			// Mock successful test case creation
			mockCreate.mockResolvedValueOnce({
				Object: {
					FormattedID: 'TC127',
					Name: 'Test Case for Defect with Steps',
					_ref: '/testcase/127'
				}
			});

			// Mock successful steps creation
			mockCreate.mockResolvedValueOnce([
				{
					Object: {
						StepIndex: 1,
						Input: 'Step 1 input',
						ExpectedResult: 'Step 1 result'
					}
				},
				{
					Object: {
						StepIndex: 2,
						Input: 'Step 2 input',
						ExpectedResult: 'Step 2 result'
					}
				}
			]);

			const testCase = {
				Name: 'Test Case for Defect with Steps',
				WorkProduct: '/defect/82742517605',
				Project: '/project/12345',
				Owner: '/user/12345',
				TestFolder: '/testfolder/12345',
				Steps: [
					{
						Input: 'Step 1 input',
						ExpectedResult: 'Step 1 result'
					},
					{
						Input: 'Step 2 input',
						ExpectedResult: 'Step 2 result'
					}
				]
			};

			const result = await createTestCase({ testCase });

			expect(result.isError).toBeUndefined();
			expect(mockCreate).toHaveBeenCalledTimes(2); // Once for test case, once for steps
			expect(result.structuredContent.TotalSteps).toBe(2);
		});
	});
});
