import { vi } from 'vitest';
// Vitest globals are available without import

// Mock the Rally API and queryUtils
const mockQuery = vi.fn();
const mockWhere = vi.fn((field, operator, value) => ({
	field,
	operator,
	value,
	and: function(other) {
		return {
			queries: [this, other],
			and: function(another) {
				return {
					queries: [...this.queries, another],
					and: arguments.callee
				};
			}
		};
	}
}));

vi.mock('../src/utils.js', () => ({
	getRallyApi: vi.fn(() => ({
		query: mockQuery
	})),
	queryUtils: {
		where: mockWhere
	}
}));

describe('getDefects', () => {
	let getDefects;

	beforeEach(async () => {
		vi.clearAllMocks();
		const module = await import('../src/tools/getDefects.js');
		getDefects = module.getDefects;
	});

	it('should use queryUtils.where for building queries', async () => {
		mockQuery.mockResolvedValue({
			Results: [
				{
					ObjectID: '82742517605',
					FormattedID: 'DE123',
					Name: 'Test Defect',
					State: 'Open',
					Severity: 'High',
					Priority: 'High',
					Description: 'Test description',
					Owner: { _refObjectName: 'John Doe' },
					Project: { _refObjectName: 'Test Project' },
					Iteration: { _refObjectName: 'Sprint 1' },
					CreationDate: '2024-01-01',
					LastUpdateDate: '2024-01-02',
					_ref: '/defect/82742517605'
				}
			]
		});

		await getDefects({
			query: { ObjectID: '82742517605' },
			project: '/project/12345'
		});

		// Verify queryUtils.where was called for both Project and ObjectID
		expect(mockWhere).toHaveBeenCalledWith('Project', '=', '/project/12345');
		expect(mockWhere).toHaveBeenCalledWith('ObjectID', '=', 82742517605);
		expect(mockWhere).toHaveBeenCalledTimes(2);
	});

	it('should build query with only project filter when no additional query provided', async () => {
		mockQuery.mockResolvedValue({
			Results: []
		});

		await getDefects({
			project: '/project/12345'
		});

		// Verify queryUtils.where was called only for Project
		expect(mockWhere).toHaveBeenCalledWith('Project', '=', '/project/12345');
		expect(mockWhere).toHaveBeenCalledTimes(1);
	});

	it('should include ObjectID in the returned defects', async () => {
		mockQuery.mockResolvedValue({
			Results: [
				{
					ObjectID: '82742517605',
					FormattedID: 'DE123',
					Name: 'Test Defect',
					State: 'Open',
					Severity: 'High',
					Priority: 'High',
					Description: 'Test description',
					Owner: { _refObjectName: 'John Doe' },
					Project: { _refObjectName: 'Test Project' },
					Iteration: { _refObjectName: 'Sprint 1' },
					CreationDate: '2024-01-01',
					LastUpdateDate: '2024-01-02',
					_ref: '/defect/82742517605'
				}
			]
		});

		const result = await getDefects({
			query: { ObjectID: '82742517605' },
			project: '/project/12345'
		});

		const defectsJson = JSON.parse(result.content[0].text.split('defects trobats: ')[1]);
		expect(defectsJson[0]).toHaveProperty('ObjectID', '82742517605');
	});

	it('should handle multiple query filters', async () => {
		mockQuery.mockResolvedValue({
			Results: []
		});

		await getDefects({
			query: {
				ObjectID: '82742517605',
				State: 'Open',
				Severity: 'High'
			},
			project: '/project/12345'
		});

		// Verify queryUtils.where was called for all filters
		expect(mockWhere).toHaveBeenCalledWith('Project', '=', '/project/12345');
		expect(mockWhere).toHaveBeenCalledWith('ObjectID', '=', 82742517605);
		expect(mockWhere).toHaveBeenCalledWith('State', '=', 'Open');
		expect(mockWhere).toHaveBeenCalledWith('Severity', '=', 'High');
		expect(mockWhere).toHaveBeenCalledTimes(4);
	});

	it('should fetch ObjectID field from Rally API', async () => {
		mockQuery.mockResolvedValue({
			Results: []
		});

		await getDefects({
			query: { ObjectID: '82742517605' },
			project: '/project/12345'
		});

		// Verify that ObjectID is in the fetch array
		expect(mockQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				fetch: expect.arrayContaining(['ObjectID'])
			})
		);
	});

	it('should handle errors gracefully', async () => {
		mockQuery.mockRejectedValue(new Error('API Error'));

		const result = await getDefects({
			query: { ObjectID: '82742517605' },
			project: '/project/12345'
		});

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('Error en getDefects: API Error');
	});

	it('should handle invalid ObjectID values', async () => {
		const result = await getDefects({
			query: { ObjectID: 'invalid' },
			project: '/project/12345'
		});

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('Invalid ObjectID value');
	});

	it('should reject ObjectID with partial numbers', async () => {
		const result = await getDefects({
			query: { ObjectID: '123abc' },
			project: '/project/12345'
		});

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('Invalid ObjectID value');
	});

	it('should reject negative ObjectID values', async () => {
		const result = await getDefects({
			query: { ObjectID: '-123' },
			project: '/project/12345'
		});

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('Invalid ObjectID value');
	});

	it('should reject ObjectID values outside safe integer range', async () => {
		const result = await getDefects({
			query: { ObjectID: '9007199254740992' }, // Number.MAX_SAFE_INTEGER + 1
			project: '/project/12345'
		});

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain('outside the safe integer range');
	});

	it('should handle ObjectID with leading/trailing whitespace', async () => {
		mockQuery.mockResolvedValue({
			Results: []
		});

		await getDefects({
			query: { ObjectID: '  82742517605  ' },
			project: '/project/12345'
		});

		// Should trim and convert to number
		expect(mockWhere).toHaveBeenCalledWith('ObjectID', '=', 82742517605);
	});
});
