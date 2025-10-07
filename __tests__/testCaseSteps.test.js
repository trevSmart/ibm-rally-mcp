import { vi } from 'vitest';
// Vitest globals are available without import

// Mock del módulo index.js
vi.mock('../index.js', () => ({
  log: vi.fn()
}));

// Mock del módulo utils.js
vi.mock('../src/utils.js', () => ({
  getRallyApi: vi.fn(),
  queryUtils: {
    where: vi.fn((field, op, value) => ({
      and: vi.fn((otherQuery) => ({ field, op, value, andQuery: otherQuery }))
    }))
  }
}));

import { createTestCaseStep, createTestCaseStepTool } from '../src/tools/createTestCaseStep.js';
import { updateTestCaseStep, updateTestCaseStepTool } from '../src/tools/updateTestCaseStep.js';
import { getRallyApi } from '../src/utils.js';

describe('Test Case Step Management Tools', () => {
  let mockRallyApi;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRallyApi = {
      query: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    };
    getRallyApi.mockReturnValue(mockRallyApi);
  });

  describe('createTestCaseStep', () => {
    it('should create a step at the end when no Order is specified', async () => {
      const testCaseId = '12345';
      const Input = 'Test input';
      const ExpectedResult = 'Test expected result';

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock existing steps query (3 existing steps)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [
          { ObjectID: '1', StepIndex: 1, _ref: '/testcasestep/1' },
          { ObjectID: '2', StepIndex: 2, _ref: '/testcasestep/2' },
          { ObjectID: '3', StepIndex: 3, _ref: '/testcasestep/3' }
        ]
      });

      // Mock step creation
      mockRallyApi.create.mockResolvedValue({
        Object: {
          StepIndex: 4,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await createTestCaseStep({ testCaseId, Input, ExpectedResult });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Step.StepIndex).toBe(4);
      expect(result.structuredContent.Step.Input).toBe('Test input');
      expect(mockRallyApi.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'testcasestep',
        data: expect.objectContaining({
          TestCase: '/testcase/12345',
          StepIndex: 4,
          Input: 'Test input',
          ExpectedResult: 'Test expected result'
        })
      }));
      expect(mockRallyApi.update).not.toHaveBeenCalled(); // No reordering needed
    });

    it('should insert step at specified Order and reorder existing steps', async () => {
      const testCaseId = '12345';
      const Input = 'New step input';
      const ExpectedResult = 'New step result';
      const Order = 2;

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock existing steps query (3 existing steps)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [
          { ObjectID: '1', StepIndex: 1, _ref: '/testcasestep/1' },
          { ObjectID: '2', StepIndex: 2, _ref: '/testcasestep/2' },
          { ObjectID: '3', StepIndex: 3, _ref: '/testcasestep/3' }
        ]
      });

      // Mock updates for reordering (step 3 -> 4, step 2 -> 3)
      mockRallyApi.update.mockResolvedValue({});

      // Mock step creation
      mockRallyApi.create.mockResolvedValue({
        Object: {
          StepIndex: 2,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await createTestCaseStep({ testCaseId, Input, ExpectedResult, Order });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Step.StepIndex).toBe(2);

      // Verify reordering happened (2 updates for steps 2 and 3)
      expect(mockRallyApi.update).toHaveBeenCalledTimes(2);
      expect(mockRallyApi.update).toHaveBeenCalledWith({
        ref: '/testcasestep/3',
        data: { StepIndex: 4 }
      });
      expect(mockRallyApi.update).toHaveBeenCalledWith({
        ref: '/testcasestep/2',
        data: { StepIndex: 3 }
      });
    });

    it('should insert at end when Order is greater than total steps', async () => {
      const testCaseId = '12345';
      const Input = 'Test input';
      const ExpectedResult = 'Test result';
      const Order = 10; // Greater than 3 existing steps

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock existing steps query (3 existing steps)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [
          { ObjectID: '1', StepIndex: 1, _ref: '/testcasestep/1' },
          { ObjectID: '2', StepIndex: 2, _ref: '/testcasestep/2' },
          { ObjectID: '3', StepIndex: 3, _ref: '/testcasestep/3' }
        ]
      });

      // Mock step creation
      mockRallyApi.create.mockResolvedValue({
        Object: {
          StepIndex: 4,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await createTestCaseStep({ testCaseId, Input, ExpectedResult, Order });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Step.StepIndex).toBe(4);
      expect(mockRallyApi.update).not.toHaveBeenCalled(); // No reordering
    });

    it('should insert at end when Order is less than 1', async () => {
      const testCaseId = '12345';
      const Input = 'Test input';
      const ExpectedResult = 'Test result';
      const Order = 0; // Invalid

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock existing steps query (2 existing steps)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [
          { ObjectID: '1', StepIndex: 1, _ref: '/testcasestep/1' },
          { ObjectID: '2', StepIndex: 2, _ref: '/testcasestep/2' }
        ]
      });

      // Mock step creation
      mockRallyApi.create.mockResolvedValue({
        Object: {
          StepIndex: 3,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await createTestCaseStep({ testCaseId, Input, ExpectedResult, Order });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Step.StepIndex).toBe(3);
      expect(mockRallyApi.update).not.toHaveBeenCalled();
    });

    it('should create first step when test case has no steps', async () => {
      const testCaseId = '12345';
      const Input = 'First step';
      const ExpectedResult = 'First result';

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock existing steps query (no existing steps)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: []
      });

      // Mock step creation
      mockRallyApi.create.mockResolvedValue({
        Object: {
          StepIndex: 1,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await createTestCaseStep({ testCaseId, Input, ExpectedResult });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.Step.StepIndex).toBe(1);
    });

    it('should return error when testCaseId is missing', async () => {
      const result = await createTestCaseStep({
        Input: 'Test',
        ExpectedResult: 'Result'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('testCaseId is required');
    });

    it('should return error when Input is missing', async () => {
      const result = await createTestCaseStep({
        testCaseId: '12345',
        ExpectedResult: 'Result'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Input and ExpectedResult are required');
    });

    it('should return error when ExpectedResult is missing', async () => {
      const result = await createTestCaseStep({
        testCaseId: '12345',
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Input and ExpectedResult are required');
    });

    it('should return error when test case not found', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      const result = await createTestCaseStep({
        testCaseId: '12345',
        Input: 'Test',
        ExpectedResult: 'Result'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });
  });

  describe('updateTestCaseStep', () => {
    it('should update step by stepId', async () => {
      const stepId = '67890';
      const Input = 'Updated input';
      const ExpectedResult = 'Updated result';

      // Mock step query by stepId
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: stepId,
          StepIndex: 2,
          Input: 'Original input',
          ExpectedResult: 'Original result',
          TestCase: { _ref: '/testcase/12345' },
          _ref: '/testcasestep/67890'
        }]
      });

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: '12345',
          FormattedID: 'TC123',
          Name: 'Test Case'
        }]
      });

      // Mock step update
      mockRallyApi.update.mockResolvedValue({
        Object: {
          ObjectID: stepId,
          StepIndex: 2,
          Input: Input,
          ExpectedResult: ExpectedResult
        }
      });

      const result = await updateTestCaseStep({ stepId, Input, ExpectedResult });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.UpdatedStep.Input).toBe('Updated input');
      expect(result.structuredContent.UpdatedStep.ExpectedResult).toBe('Updated result');
      expect(mockRallyApi.update).toHaveBeenCalledWith(expect.objectContaining({
        ref: '/testcasestep/67890',
        data: { Input, ExpectedResult }
      }));
    });

    it('should update step by testCaseId and stepIndex', async () => {
      const testCaseId = '12345';
      const stepIndex = 2;
      const Input = 'Updated input';

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: testCaseId,
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock step query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: '67890',
          StepIndex: stepIndex,
          Input: 'Original input',
          ExpectedResult: 'Original result',
          _ref: '/testcasestep/67890'
        }]
      });

      // Mock step update
      mockRallyApi.update.mockResolvedValue({
        Object: {
          ObjectID: '67890',
          StepIndex: stepIndex,
          Input: Input,
          ExpectedResult: 'Original result'
        }
      });

      const result = await updateTestCaseStep({ testCaseId, stepIndex, Input });

      expect(result.isError).toBeUndefined();
      expect(result.structuredContent.UpdatedStep.Input).toBe('Updated input');
      expect(mockRallyApi.update).toHaveBeenCalledWith(expect.objectContaining({
        ref: '/testcasestep/67890',
        data: { Input } // Only Input should be updated
      }));
    });

    it('should update only ExpectedResult when only that is provided', async () => {
      const stepId = '67890';
      const ExpectedResult = 'Updated result only';

      // Mock step query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: stepId,
          StepIndex: 1,
          Input: 'Original input',
          ExpectedResult: 'Original result',
          TestCase: { _ref: '/testcase/12345' },
          _ref: '/testcasestep/67890'
        }]
      });

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: '12345',
          FormattedID: 'TC123',
          Name: 'Test Case'
        }]
      });

      // Mock step update
      mockRallyApi.update.mockResolvedValue({
        Object: {
          ObjectID: stepId,
          StepIndex: 1,
          Input: 'Original input',
          ExpectedResult: ExpectedResult
        }
      });

      const result = await updateTestCaseStep({ stepId, ExpectedResult });

      expect(result.isError).toBeUndefined();
      expect(mockRallyApi.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { ExpectedResult }
      }));
    });

    it('should return error when neither stepId nor testCaseId+stepIndex provided', async () => {
      const result = await updateTestCaseStep({
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Either stepId OR (testCaseId + stepIndex)');
    });

    it('should return error when testCaseId provided without stepIndex', async () => {
      const result = await updateTestCaseStep({
        testCaseId: '12345',
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Either stepId OR (testCaseId + stepIndex)');
    });

    it('should return error when no fields to update', async () => {
      const stepId = '67890';

      // Mock step query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: stepId,
          StepIndex: 1,
          TestCase: { _ref: '/testcase/12345' },
          _ref: '/testcasestep/67890'
        }]
      });

      // Mock test case query
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: '12345',
          FormattedID: 'TC123',
          Name: 'Test Case'
        }]
      });

      const result = await updateTestCaseStep({ stepId });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('At least one field to update');
    });

    it('should return error when step not found by stepId', async () => {
      mockRallyApi.query.mockResolvedValueOnce({
        Results: []
      });

      const result = await updateTestCaseStep({
        stepId: '99999',
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should return error when test case not found', async () => {
      mockRallyApi.query.mockResolvedValueOnce({
        Results: []
      });

      const result = await updateTestCaseStep({
        testCaseId: '99999',
        stepIndex: 1,
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should return error when step not found by testCaseId and stepIndex', async () => {
      // Mock test case query (found)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: [{
          ObjectID: '12345',
          FormattedID: 'TC123',
          Name: 'Test Case',
          _ref: '/testcase/12345'
        }]
      });

      // Mock step query (not found)
      mockRallyApi.query.mockResolvedValueOnce({
        Results: []
      });

      const result = await updateTestCaseStep({
        testCaseId: '12345',
        stepIndex: 99,
        Input: 'Test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });
  });

  describe('Tool Definitions', () => {
    it('createTestCaseStepTool should have correct definition', () => {
      expect(createTestCaseStepTool).toHaveProperty('name', 'createTestCaseStep');
      expect(createTestCaseStepTool).toHaveProperty('title', 'Create Test Case Step');
      expect(createTestCaseStepTool).toHaveProperty('description');
      expect(createTestCaseStepTool.inputSchema).toHaveProperty('testCaseId');
      expect(createTestCaseStepTool.inputSchema).toHaveProperty('Input');
      expect(createTestCaseStepTool.inputSchema).toHaveProperty('ExpectedResult');
      expect(createTestCaseStepTool.inputSchema).toHaveProperty('Order');
    });

    it('updateTestCaseStepTool should have correct definition', () => {
      expect(updateTestCaseStepTool).toHaveProperty('name', 'updateTestCaseStep');
      expect(updateTestCaseStepTool).toHaveProperty('title', 'Update Test Case Step');
      expect(updateTestCaseStepTool).toHaveProperty('description');
      expect(updateTestCaseStepTool.inputSchema).toHaveProperty('stepId');
      expect(updateTestCaseStepTool.inputSchema).toHaveProperty('testCaseId');
      expect(updateTestCaseStepTool.inputSchema).toHaveProperty('stepIndex');
      expect(updateTestCaseStepTool.inputSchema).toHaveProperty('Input');
      expect(updateTestCaseStepTool.inputSchema).toHaveProperty('ExpectedResult');
    });
  });
});
