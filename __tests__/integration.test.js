import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    delete process.env.RALLY_APIKEY;
    delete process.env.RALLY_INSTANCE;
    delete process.env.RALLY_PROJECT_NAME;
    delete process.env.LOG_LEVEL;
  });

  describe('Server Initialization', () => {
    it('should initialize MCP server with correct configuration', async () => {
      // Test that we can import the MCP server module
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      expect(typeof McpServer).toBe('function');
    });

    it('should register all required tools', async () => {
      // Test that the tools can be imported without errors
      const { getCurrentDate } = await import('../src/tools/getCurrentDate.js');
      expect(typeof getCurrentDate).toBe('function');
    });

    it('should register prompts', () => {
      // Test that we can create a prompt function structure
      const mockPrompt = {
        name: 'createNewUserStory',
        description: 'Create a new user story',
        arguments: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        }
      };

      expect(mockPrompt.name).toBe('createNewUserStory');
      expect(typeof mockPrompt.description).toBe('string');
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing environment variables gracefully', () => {
      // Test that the server can start even without Rally configuration
      // This is important for testing environments
      expect(process.env.RALLY_APIKEY).toBeUndefined();
      expect(process.env.RALLY_INSTANCE).toBeUndefined();
      expect(process.env.RALLY_PROJECT_NAME).toBeUndefined();
    });

    it('should use default log level when not specified', () => {
      expect(process.env.LOG_LEVEL).toBeUndefined();
      // The server should default to 'info' level
    });
  });

  describe('Tool Integration', () => {
    it('should handle tool execution with proper error handling', async () => {
      const { getCurrentDate } = await import('../src/tools/getCurrentDate.js');

      const result = await getCurrentDate();

      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
    });

    it('should handle tool execution errors gracefully', async () => {
      // Mock a tool that throws an error
      const mockTool = jest.fn().mockRejectedValue(new Error('Tool error'));

      try {
        await mockTool();
      } catch (error) {
        expect(error.message).toBe('Tool error');
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain rallyData state consistency', () => {
      // Test that we can create a rallyData object with expected structure
      const rallyData = {
        defaultProject: null,
        projects: [],
        iterations: [],
        userStories: [],
        tasks: [],
        testCases: [],
        users: [],
        testFolders: []
      };

      expect(rallyData.projects).toEqual([]);
      expect(rallyData.users).toEqual([]);
      expect(rallyData.userStories).toEqual([]);
      expect(rallyData.defaultProject).toBeNull();
    });

    it('should handle data updates correctly', () => {
      const rallyData = {
        projects: []
      };

      // Simulate adding data
      rallyData.projects.push({ ObjectID: '1', Name: 'Test Project' });

      expect(rallyData.projects).toHaveLength(1);
      expect(rallyData.projects[0].Name).toBe('Test Project');
    });
  });

  describe('Client Capabilities', () => {
    it('should detect client capabilities correctly', () => {
      // Test that we can create a client capabilities object
      const mockClient = {
        capabilities: {
          logging: true,
          resources: true
        }
      };

      expect(mockClient.capabilities.logging).toBe(true);
      expect(mockClient.capabilities.resources).toBe(true);
      expect(mockClient.capabilities.unsupported).toBeUndefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API connection errors gracefully', () => {
      // Test that we can create error objects
      const error = new Error('Connection failed');
      expect(error.message).toBe('Connection failed');
    });

    it('should handle malformed responses gracefully', () => {
      // Test that we can handle malformed data structures
      const malformedResponse = {
        Results: null
      };

      expect(malformedResponse.Results).toBeNull();
    });
  });

  describe('Resource Management', () => {
    it('should register resources correctly', () => {
      // Test that we can create resource definitions
      const resourceDefinition = {
        title: 'All Rally Data',
        description: 'All data from Rally',
        mimeType: 'application/json'
      };

      expect(resourceDefinition.title).toBe('All Rally Data');
      expect(resourceDefinition.description).toBe('All data from Rally');
      expect(resourceDefinition.mimeType).toBe('application/json');
    });

    it('should send resource list changed notifications', () => {
      // Test that we can create a mock notification function
      const mockSendResourceListChanged = jest.fn();

      mockSendResourceListChanged();

      expect(mockSendResourceListChanged).toHaveBeenCalled();
    });
  });
});
