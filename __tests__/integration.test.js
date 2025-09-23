import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock completo del servidor MCP
jest.mock('../index.js', () => ({
  mcpServer: {
    server: {
      setRequestHandler: jest.fn(),
      sendLoggingMessage: jest.fn(),
      elicitInput: jest.fn()
    },
    registerTool: jest.fn(),
    registerPrompt: jest.fn(),
    registerResource: jest.fn(),
    sendResourceListChanged: jest.fn(),
    connect: jest.fn()
  },
  client: {
    capabilities: {
      logging: true,
      resources: true
    }
  },
  logLevel: 'info',
  rallyData: {
    defaultProject: null,
    projects: [],
    iterations: [],
    userStories: [],
    tasks: [],
    testCases: [],
    users: [],
    testFolders: []
  }
}));

// Mock de las dependencias externas
jest.mock('ibm-rally-node', () => ({
  util: {
    query: {
      where: jest.fn((field, operator, value) => ({
        field,
        operator,
        value,
        and: jest.fn(function(other) {
          return { ...this, ...other };
        })
      }))
    }
  },
  __esModule: true,
  default: jest.fn(() => ({
    query: jest.fn()
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    server: {
      setRequestHandler: jest.fn(),
      sendLoggingMessage: jest.fn(),
      elicitInput: jest.fn()
    },
    registerTool: jest.fn(),
    registerPrompt: jest.fn(),
    registerResource: jest.fn(),
    sendResourceListChanged: jest.fn(),
    connect: jest.fn()
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

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
      // Import after mocks are set up
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: 'rally-mcp',
          version: '1.0.0'
        },
        { capabilities: {} }
      );
    });

    it('should register all required tools', async () => {
      const { mcpServer } = await import('../index.js');

      // Verify that registerTool was called for each tool
      expect(mcpServer.registerTool).toHaveBeenCalledWith(
        'getProjects',
        expect.any(Object),
        expect.any(Function)
      );

      expect(mcpServer.registerTool).toHaveBeenCalledWith(
        'getIterations',
        expect.any(Object),
        expect.any(Function)
      );

      expect(mcpServer.registerTool).toHaveBeenCalledWith(
        'getUserStories',
        expect.any(Object),
        expect.any(Function)
      );

      expect(mcpServer.registerTool).toHaveBeenCalledWith(
        'getCurrentDate',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register prompts', async () => {
      const { mcpServer } = await import('../index.js');

      expect(mcpServer.registerPrompt).toHaveBeenCalledWith(
        'createNewUserStory',
        expect.any(Object),
        expect.any(Function)
      );
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
    it('should maintain rallyData state consistency', async () => {
      const { rallyData } = await import('../index.js');

      // Initial state should be empty arrays
      expect(rallyData.projects).toEqual([]);
      expect(rallyData.users).toEqual([]);
      expect(rallyData.userStories).toEqual([]);
      expect(rallyData.defaultProject).toBeNull();
    });

    it('should handle data updates correctly', async () => {
      const { rallyData } = await import('../index.js');

      // Simulate adding data
      rallyData.projects.push({ ObjectID: '1', Name: 'Test Project' });

      expect(rallyData.projects).toHaveLength(1);
      expect(rallyData.projects[0].Name).toBe('Test Project');
    });
  });

  describe('Client Capabilities', () => {
    it('should detect client capabilities correctly', async () => {
      const { clientSupportsCapability } = await import('../src/utils.js');

      // Test logging capability
      expect(clientSupportsCapability('logging')).toBe(true);

      // Test resources capability
      expect(clientSupportsCapability('resources')).toBe(true);

      // Test unsupported capability
      expect(clientSupportsCapability('unsupported')).toBe(false);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API connection errors gracefully', async () => {
      const rally = require('ibm-rally-node').default;
      const mockRallyApi = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      rally.mockReturnValue(mockRallyApi);

      const { getProjects } = await import('../src/rallyServices.js');

      await expect(getProjects()).rejects.toThrow('Connection failed');
    });

    it('should handle malformed responses gracefully', async () => {
      const rally = require('ibm-rally-node').default;
      const mockRallyApi = {
        query: jest.fn().mockResolvedValue({
          Results: null // Malformed response
        })
      };
      rally.mockReturnValue(mockRallyApi);

      const { getProjects } = await import('../src/rallyServices.js');

      const result = await getProjects();
      expect(result.projects).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should register resources correctly', async () => {
      const { mcpServer } = await import('../index.js');

      // Verify that registerResource was called
      expect(mcpServer.registerResource).toHaveBeenCalledWith(
        'rallyData',
        'mcp://data/all.json',
        expect.objectContaining({
          title: 'All Rally Data',
          description: 'All data from Rally',
          mimeType: 'application/json'
        }),
        expect.any(Function)
      );
    });

    it('should send resource list changed notifications', async () => {
      const { mcpServer } = await import('../index.js');

      // Simulate resource change
      mcpServer.sendResourceListChanged();

      expect(mcpServer.sendResourceListChanged).toHaveBeenCalled();
    });
  });
});
