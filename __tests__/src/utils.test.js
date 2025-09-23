import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock del módulo ibm-rally-node
jest.mock('ibm-rally-node', () => ({
  util: {
    query: {
      where: jest.fn((field, operator, value) => ({
        field,
        operator,
        value
      }))
    }
  },
  __esModule: true,
  default: jest.fn(() => ({
    query: jest.fn()
  }))
}));

// Mock del módulo index.js
jest.mock('../../index.js', () => ({
  mcpServer: {
    server: {
      sendLoggingMessage: jest.fn()
    }
  },
  client: {
    capabilities: {}
  },
  logLevel: 'info'
}));

import { getRallyApi, queryUtils, getProjectId, log, clientSupportsCapability } from '../../src/utils.js';

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.RALLY_APIKEY;
    delete process.env.RALLY_INSTANCE;
    delete process.env.RALLY_PROJECT_NAME;
  });

  describe('getRallyApi', () => {
    it('should create Rally API instance with correct configuration', () => {
      process.env.RALLY_APIKEY = 'test-api-key';
      process.env.RALLY_INSTANCE = 'https://rally.example.com';

      const api = getRallyApi();

      expect(api).toBeDefined();
      expect(typeof api).toBe('function');
    });

    it('should include custom headers in request options', () => {
      process.env.RALLY_APIKEY = 'test-api-key';
      process.env.RALLY_INSTANCE = 'https://rally.example.com';

      getRallyApi();

      // Verify that the rally function was called with correct options
      const rally = require('ibm-rally-node').default;
      expect(rally).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        server: 'https://rally.example.com',
        requestOptions: {
          headers: {
            'X-RallyIntegrationName': 'MCP Rally Server',
            'X-RallyIntegrationVendor': 'My company',
            'X-RallyIntegrationVersion': '1.0.0'
          }
        }
      });
    });
  });

  describe('queryUtils', () => {
    it('should create where clause correctly', () => {
      const whereClause = queryUtils.where('Name', '=', 'Test Project');

      expect(whereClause).toEqual({
        field: 'Name',
        operator: '=',
        value: 'Test Project'
      });
    });
  });

  describe('getProjectId', () => {
    it('should throw error when RALLY_PROJECT_NAME is not set', async () => {
      await expect(getProjectId()).rejects.toThrow('No s\'ha trobat la variable d\'entorn RALLY_PROJECT_NAME');
    });

    it('should throw error when project is not found', async () => {
      process.env.RALLY_PROJECT_NAME = 'NonExistentProject';

      const rally = require('ibm-rally-node').default;
      const mockRallyApi = {
        query: jest.fn().mockResolvedValue({
          Results: []
        })
      };
      rally.mockReturnValue(mockRallyApi);

      await expect(getProjectId()).rejects.toThrow('No s\'ha trobat cap projecte amb el nom "NonExistentProject"');
    });

    it('should return project ID when project is found', async () => {
      process.env.RALLY_PROJECT_NAME = 'TestProject';

      const rally = require('ibm-rally-node').default;
      const mockRallyApi = {
        query: jest.fn().mockResolvedValue({
          Results: [{
            ObjectID: '12345',
            Name: 'TestProject'
          }]
        })
      };
      rally.mockReturnValue(mockRallyApi);

      const projectId = await getProjectId();

      expect(projectId).toBe('12345');
      expect(mockRallyApi.query).toHaveBeenCalledWith({
        type: 'project',
        fetch: ['ObjectID', 'Name'],
        query: {
          field: 'Name',
          operator: '=',
          value: 'TestProject'
        }
      });
    });
  });

  describe('log', () => {
    it('should handle string data correctly', async () => {
      const { mcpServer } = require('../../index.js');
      mcpServer.server.sendLoggingMessage.mockResolvedValue();

      await log('Test message', 'info');

      expect(mcpServer.server.sendLoggingMessage).toHaveBeenCalledWith({
        level: 'info',
        logger: 'MCP server',
        data: '\nTest message\n'
      });
    });

    it('should handle object data by converting to JSON', async () => {
      const { mcpServer } = require('../../index.js');
      mcpServer.server.sendLoggingMessage.mockResolvedValue();

      const testObject = { test: 'data' };
      await log(testObject, 'debug');

      expect(mcpServer.server.sendLoggingMessage).toHaveBeenCalledWith({
        level: 'debug',
        logger: 'MCP server',
        data: '\n{"test":"data"}\n'
      });
    });

    it('should truncate long strings', async () => {
      const { mcpServer } = require('../../index.js');
      mcpServer.server.sendLoggingMessage.mockResolvedValue();

      const longString = 'a'.repeat(5000);
      await log(longString, 'info');

      expect(mcpServer.server.sendLoggingMessage).toHaveBeenCalledWith({
        level: 'info',
        logger: 'MCP server',
        data: expect.stringMatching(/^\\n.*\\.\\.\\.\\n$/)
      });
    });

    it('should handle logging errors gracefully', async () => {
      const { mcpServer } = require('../../index.js');
      mcpServer.server.sendLoggingMessage.mockRejectedValue(new Error('Logging failed'));

      // Should not throw
      await expect(log('Test message')).resolves.toBeUndefined();
    });
  });

  describe('clientSupportsCapability', () => {
    it('should return true for supported capabilities', () => {
      const { client } = require('../../index.js');
      client.capabilities = {
        resources: true,
        logging: true
      };

      expect(clientSupportsCapability('resources')).toBe(true);
      expect(clientSupportsCapability('logging')).toBe(true);
    });

    it('should return false for unsupported capabilities', () => {
      const { client } = require('../../index.js');
      client.capabilities = {
        resources: true
      };

      expect(clientSupportsCapability('logging')).toBe(false);
      expect(clientSupportsCapability('nonexistent')).toBe(false);
    });

    it('should return false for resourceLinks capability', () => {
      const { client } = require('../../index.js');
      client.capabilities = {
        resourceLinks: true
      };

      expect(clientSupportsCapability('resourceLinks')).toBe(false);
    });

    it('should handle undefined capabilities', () => {
      const { client } = require('../../index.js');
      client.capabilities = {};

      expect(clientSupportsCapability('logging')).toBe(false);
    });
  });
});
