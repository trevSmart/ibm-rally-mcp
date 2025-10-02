import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock del módulo index.js
jest.mock('../../index.js', () => ({
  mcpServer: {
    sendResourceListChanged: jest.fn()
  },
  log: jest.fn()
}));

// Mock del módulo rallyServices.js
jest.mock('../../src/rallyServices.js', () => ({
  getProjects: jest.fn()
}));

// Mock del módulo utils.js
jest.mock('../../src/utils.js', () => ({
  log: jest.fn()
}));

import { getCurrentDate, getCurrentDateTool } from '../../src/tools/getCurrentDate.js';
import { getProjectsTool, getProjectsToolDefinition } from '../../src/tools/getProjects.js';
import { getProjects } from '../../src/rallyServices.js';
import { log } from '../../index.js';

describe('Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentDate', () => {
    it('should return current date and time information', async () => {
      const result = await getCurrentDate();

      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0].text).toContain('Data i hora actual:');
      expect(result.content[0].text).toContain('now');
      expect(result.content[0].text).toContain('nowLocaleString');
      expect(result.content[0].text).toContain('nowIsoString');
      expect(result.content[0].text).toContain('timezone');
    });

    it('should return error when exception occurs', async () => {
      // Mock Date constructor to throw error
      const originalDate = global.Date;
      global.Date = jest.fn(() => {
        throw new Error('Date error');
      });

      const result = await getCurrentDate();

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Error en getCurrentDate: Date error');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should include timezone information', async () => {
      const result = await getCurrentDate();
      const textContent = result.content[0].text;

      // Parse the JSON from the text content
      const jsonMatch = textContent.match(/Data i hora actual:\n\n(.*)/s);
      expect(jsonMatch).toBeTruthy();

      const dateInfo = JSON.parse(jsonMatch[1]);
      expect(dateInfo).toHaveProperty('timezone');
      expect(typeof dateInfo.timezone).toBe('string');
    });
  });

  describe('getCurrentDateTool', () => {
    it('should have correct tool definition', () => {
      expect(getCurrentDateTool).toEqual({
        name: 'getCurrentDate',
        title: 'Get Current Date',
        description: 'This tool retrieves the current date and time information.',
        inputSchema: {},
        annotations: {
          readOnlyHint: true
        }
      });
    });
  });

  describe('getProjectsTool', () => {
    it('should return projects when found', async () => {
      const mockProjects = [
        { ObjectID: '1', Name: 'Test Project 1' },
        { ObjectID: '2', Name: 'Test Project 2' }
      ];

      getProjects.mockResolvedValue({
        projects: mockProjects,
        source: 'api',
        count: 2
      });

      const result = await getProjectsTool({ query: { Name: 'Test' } });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Projectes actius trobats a Rally via API (2)');
      expect(result.content[0].text).toContain('Test Project 1');
      expect(result.content[0].text).toContain('Test Project 2');
      expect(result).toHaveProperty('structuredContent');
      expect(result.structuredContent.projects).toEqual(mockProjects);
      expect(log).toHaveBeenCalledWith('getProjectsTool');
    });

    it('should return cached projects message when source is cache', async () => {
      const mockProjects = [
        { ObjectID: '1', Name: 'Cached Project' }
      ];

      getProjects.mockResolvedValue({
        projects: mockProjects,
        source: 'cache',
        count: 1
      });

      const result = await getProjectsTool({ query: {} });

      expect(result.content[0].text).toContain('Projectes actius trobats a Rally via cache (1)');
    });

    it('should return no projects message when count is 0', async () => {
      getProjects.mockResolvedValue({
        projects: [],
        source: 'api',
        count: 0
      });

      const result = await getProjectsTool({ query: {} });

      expect(result.content[0].text).toBe('No s\'han trobat projectes actius a Rally.');
      expect(result).not.toHaveProperty('structuredContent');
    });

    it('should handle errors gracefully', async () => {
      getProjects.mockRejectedValue(new Error('API Error'));

      const result = await getProjectsTool({ query: {} });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toBe('Error en getProjectsTool: API Error');
      expect(log).toHaveBeenCalledWith('Error en getProjectsTool: API Error');
    });

    it('should call sendResourceListChanged when projects are found', async () => {
      const { mcpServer } = require('../../index.js');

      getProjects.mockResolvedValue({
        projects: [{ ObjectID: '1', Name: 'Test Project' }],
        source: 'api',
        count: 1
      });

      await getProjectsTool({ query: {} });

      expect(mcpServer.sendResourceListChanged).toHaveBeenCalled();
    });

    it('should not call sendResourceListChanged when no projects found', async () => {
      const { mcpServer } = require('../../index.js');

      getProjects.mockResolvedValue({
        projects: [],
        source: 'api',
        count: 0
      });

      await getProjectsTool({ query: {} });

      expect(mcpServer.sendResourceListChanged).not.toHaveBeenCalled();
    });
  });

  describe('getProjectsToolDefinition', () => {
    it('should have correct tool definition', () => {
      expect(getProjectsToolDefinition).toHaveProperty('name', 'getProjects');
      expect(getProjectsToolDefinition).toHaveProperty('title', 'Get Projects');
      expect(getProjectsToolDefinition).toHaveProperty('description');
      expect(getProjectsToolDefinition).toHaveProperty('inputSchema');
      expect(getProjectsToolDefinition).toHaveProperty('annotations');
      expect(getProjectsToolDefinition.annotations).toHaveProperty('readOnlyHint', true);
    });

    it('should have correct input schema structure', () => {
      const schema = getProjectsToolDefinition.inputSchema;
      expect(schema).toHaveProperty('query');
      expect(schema.query).toHaveProperty('_def');
    });
  });
});
