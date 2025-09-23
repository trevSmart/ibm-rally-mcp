import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock del módulo utils.js
jest.mock('../../src/utils.js', () => ({
  getRallyApi: jest.fn(),
  queryUtils: {
    where: jest.fn((field, operator, value) => ({
      field,
      operator,
      value,
      and: jest.fn(function(other) {
        return { ...this, ...other };
      })
    }))
  }
}));

// Mock del módulo index.js
jest.mock('../../index.js', () => ({
  rallyData: {
    projects: [],
    users: [],
    userStories: [],
    defaultProject: null
  }
}));

import { getProjects, getUsers, getUserStories } from '../../src/rallyServices.js';
import { getRallyApi } from '../../src/utils.js';

describe('Rally Services', () => {
  let mockRallyApi;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rallyData
    const { rallyData } = require('../../index.js');
    rallyData.projects = [];
    rallyData.users = [];
    rallyData.userStories = [];
    rallyData.defaultProject = null;

    mockRallyApi = {
      query: jest.fn()
    };
    getRallyApi.mockReturnValue(mockRallyApi);
  });

  describe('getProjects', () => {
    it('should return cached projects when available and query matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.projects = [
        { ObjectID: '1', Name: 'Test Project', Description: 'Test Description' }
      ];

      const result = await getProjects({ Name: 'Test Project' });

      expect(result).toEqual({
        projects: [{ ObjectID: '1', Name: 'Test Project', Description: 'Test Description' }],
        source: 'cache',
        count: 1
      });
      expect(mockRallyApi.query).not.toHaveBeenCalled();
    });

    it('should query API when no cached data matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.projects = [
        { ObjectID: '1', Name: 'Other Project', Description: 'Other Description' }
      ];

      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '2',
            Name: 'Test Project',
            Description: 'Test Description',
            State: 'Active',
            CreationDate: '2024-01-01',
            LastUpdateDate: '2024-01-02',
            Owner: { _refObjectName: 'Test Owner' },
            Parent: null,
            Children: { Count: 0 }
          }
        ]
      });

      const result = await getProjects({ Name: 'Test Project' });

      expect(result.source).toBe('api');
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].Name).toBe('Test Project');
      expect(mockRallyApi.query).toHaveBeenCalled();
    });

    it('should query API when no cached data exists', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '1',
            Name: 'Test Project',
            Description: '<p>Test Description</p>',
            State: 'Active',
            CreationDate: '2024-01-01',
            LastUpdateDate: '2024-01-02',
            Owner: { _refObjectName: 'Test Owner' },
            Parent: null,
            Children: { Count: 0 }
          }
        ]
      });

      const result = await getProjects();

      expect(result.source).toBe('api');
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].Description).toBe('Test Description'); // HTML tags removed
      expect(mockRallyApi.query).toHaveBeenCalledWith({
        type: 'project',
        fetch: ['ObjectID', 'Name', 'Description', 'State', 'CreationDate', 'LastUpdateDate', 'Owner', 'Parent', 'Children']
      });
    });

    it('should handle empty results', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      const result = await getProjects();

      expect(result).toEqual({
        projects: [],
        source: 'api',
        count: 0
      });
    });

    it('should apply limit when specified', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      await getProjects({}, 10);

      expect(mockRallyApi.query).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10
        })
      );
    });

    it('should handle API errors', async () => {
      mockRallyApi.query.mockRejectedValue(new Error('API Error'));

      await expect(getProjects()).rejects.toThrow('API Error');
    });
  });

  describe('getUsers', () => {
    it('should return cached users when available and query matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.users = [
        { ObjectID: '1', DisplayName: 'Test User', EmailAddress: 'test@example.com' }
      ];

      const result = await getUsers({ DisplayName: 'Test User' });

      expect(result).toEqual({
        users: [{ ObjectID: '1', DisplayName: 'Test User', EmailAddress: 'test@example.com' }],
        source: 'cache',
        count: 1
      });
      expect(mockRallyApi.query).not.toHaveBeenCalled();
    });

    it('should query API when no cached data matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.users = [
        { ObjectID: '1', DisplayName: 'Other User', EmailAddress: 'other@example.com' }
      ];

      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '2',
            UserName: 'testuser',
            DisplayName: 'Test User',
            EmailAddress: 'test@example.com',
            FirstName: 'Test',
            LastName: 'User',
            Disabled: false,
            _ref: '/user/2'
          }
        ]
      });

      const result = await getUsers({ DisplayName: 'Test User' });

      expect(result.source).toBe('api');
      expect(result.users).toHaveLength(1);
      expect(result.users[0].DisplayName).toBe('Test User');
      expect(mockRallyApi.query).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      const result = await getUsers();

      expect(result).toEqual({
        users: [],
        source: 'api',
        count: 0
      });
    });

    it('should initialize users array if not exists', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.users = undefined;

      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '1',
            UserName: 'testuser',
            DisplayName: 'Test User',
            EmailAddress: 'test@example.com',
            FirstName: 'Test',
            LastName: 'User',
            Disabled: false,
            _ref: '/user/1'
          }
        ]
      });

      await getUsers();

      expect(rallyData.users).toBeDefined();
      expect(rallyData.users).toHaveLength(1);
    });
  });

  describe('getUserStories', () => {
    it('should return cached user stories when available and query matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.userStories = [
        { ObjectID: '1', Name: 'Test Story', State: 'Defined' }
      ];

      const result = await getUserStories({ Name: 'Test Story' });

      expect(result).toEqual({
        userStories: [{ ObjectID: '1', Name: 'Test Story', State: 'Defined' }],
        source: 'cache',
        count: 1
      });
      expect(mockRallyApi.query).not.toHaveBeenCalled();
    });

    it('should query API when no cached data matches', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.userStories = [
        { ObjectID: '1', Name: 'Other Story', State: 'Defined' }
      ];

      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '2',
            FormattedID: 'US123',
            Name: 'Test Story',
            Description: '<p>Test Description</p>',
            State: 'Defined',
            PlanEstimate: 5,
            ToDo: 3,
            Owner: { _refObjectName: 'Test Owner' },
            Project: { _refObjectName: 'Test Project' },
            Iteration: { _refObjectName: 'Sprint 1' },
            Blocked: false,
            TaskEstimateTotal: 8,
            TaskStatus: 'In Progress',
            Tasks: { Count: 2 },
            TestCases: { Count: 1 },
            Defects: { Count: 0 },
            Discussion: { Count: 1 },
            c_Appgar: 'Test Appgar'
          }
        ]
      });

      const result = await getUserStories({ Name: 'Test Story' });

      expect(result.source).toBe('api');
      expect(result.userStories).toHaveLength(1);
      expect(result.userStories[0].Name).toBe('Test Story');
      expect(result.userStories[0].Description).toBe('Test Description'); // HTML tags removed
      expect(mockRallyApi.query).toHaveBeenCalled();
    });

    it('should use default project when no project specified', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.defaultProject = { ObjectID: '123' };

      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      await getUserStories();

      expect(mockRallyApi.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            field: 'Project',
            operator: '=',
            value: '/project/123'
          })
        })
      );
    });

    it('should handle Owner field with /user/ prefix', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      await getUserStories({ Owner: '12345' });

      expect(mockRallyApi.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            field: 'Owner',
            operator: '=',
            value: '/user/12345'
          })
        })
      );
    });

    it('should handle Owner field with currentuser value', async () => {
      mockRallyApi.query.mockResolvedValue({
        Results: []
      });

      await getUserStories({ Owner: 'currentuser' });

      expect(mockRallyApi.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            field: 'Owner',
            operator: '=',
            value: 'currentuser'
          })
        })
      );
    });

    it('should initialize userStories array if not exists', async () => {
      const { rallyData } = require('../../index.js');
      rallyData.userStories = undefined;

      mockRallyApi.query.mockResolvedValue({
        Results: [
          {
            ObjectID: '1',
            FormattedID: 'US123',
            Name: 'Test Story',
            Description: 'Test Description',
            State: 'Defined',
            PlanEstimate: 5,
            ToDo: 3,
            Owner: { _refObjectName: 'Test Owner' },
            Project: { _refObjectName: 'Test Project' },
            Iteration: { _refObjectName: 'Sprint 1' },
            Blocked: false,
            TaskEstimateTotal: 8,
            TaskStatus: 'In Progress',
            Tasks: { Count: 2 },
            TestCases: { Count: 1 },
            Defects: { Count: 0 },
            Discussion: { Count: 1 },
            c_Appgar: 'Test Appgar'
          }
        ]
      });

      await getUserStories();

      expect(rallyData.userStories).toBeDefined();
      expect(rallyData.userStories).toHaveLength(1);
    });
  });
});
