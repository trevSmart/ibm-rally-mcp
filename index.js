import dotenv from 'dotenv';
dotenv.config();

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

//Tools
import {getProjects, getProjectsTool} from './tools/getProjects.js';
import {getIterations, getIterationsTool} from './tools/getIterations.js';
import {getUserStories, getUserStoriesTool} from './tools/getUserStories.js';
import {getTasks, getTasksTool} from './tools/getTasks.js';
import {getTestCases, getTestCasesTool} from './tools/getTestCases.js';
import {getTypeDefinition, getTypeDefinitionTool} from './tools/getTypeDefinition.js';
import {createUserStoryTasks, createUserStoryTasksTool} from './tools/createUserStoryTasks.js';
import {getCurrentDate, getCurrentDateTool} from './tools/getCurrentDate.js';
import {updateTask, updateTaskTool} from './tools/updateTask.js';
import {createUserStory, createUserStoryTool} from './tools/createUserStory.js';
import {createDefect, createDefectTool} from './tools/createDefect.js';
import {createTestCase, createTestCaseTool} from './tools/createTestCase.js';
import {getUsers, getUsersTool} from './tools/getUsers.js';
import {getTestFolders, getTestFoldersTool} from './tools/getTestFolders.js';

//Variable global per emmagatzemar les dades del projecte per defecte

export let rallyData = {
	defaultProject: null,
	projects: [],
	iterations: [],
	userStories: [],
	tasks: [],
	testCases: [],
	users: [],
	testFolders: []
};

const mcpServer = new McpServer({name: 'rally-mcp', version: '1.0.0', capabilities: {logging: {}, resources: {listChanged: true}, tools: {}}});
mcpServer.registerTool('getProjects', getProjectsTool, getProjects);
mcpServer.registerTool('getIterations', getIterationsTool, getIterations);
mcpServer.registerTool('getUserStories', getUserStoriesTool, getUserStories);
mcpServer.registerTool('getTasks', getTasksTool, getTasks);
mcpServer.registerTool('getTestCases', getTestCasesTool, getTestCases);
mcpServer.registerTool('getTypeDefinition', getTypeDefinitionTool, getTypeDefinition);
mcpServer.registerTool('createUserStoryTasks', createUserStoryTasksTool, createUserStoryTasks);
mcpServer.registerTool('getCurrentDate', getCurrentDateTool, getCurrentDate);
mcpServer.registerTool('updateTask', updateTaskTool, updateTask);
mcpServer.registerTool('createUserStory', createUserStoryTool, createUserStory);
mcpServer.registerTool('createDefect', createDefectTool, createDefect);
mcpServer.registerTool('createTestCase', createTestCaseTool, createTestCase);
mcpServer.registerTool('getUsers', getUsersTool, getUsers);
mcpServer.registerTool('getTestFolders', getTestFoldersTool, getTestFolders);

async function startServer() {
	try {
		//Obtenim l'ID del projecte abans d'iniciar el servidor
		const getProjectsResult = await getProjects({ query: { Name: process.env.RALLY_PROJECT_NAME } });
		if (getProjectsResult.isError || !getProjectsResult.structuredContent?.length) {
			throw new Error(`Error obtenint projecte per defecte: ${getProjectsResult.content[0].text}`);
		}
		const defaultProject = getProjectsResult.structuredContent[0];
		console.error(`Projecte per defecte: ${JSON.stringify(defaultProject, null, 3)}`);

		mcpServer.registerResource('defaultProject', `mcp://projects/default.json`, {
			title: defaultProject.Name,
			description: defaultProject.Description,
			mimeType: 'application/json',
			annotations: {audience: ['user', 'assistant'], lastModified: new Date().toISOString()}
		},	async uri => ({	contents: [{uri: uri, text: JSON.stringify(defaultProject, null, 3)}]}));
		mcpServer.sendResourceListChanged();

		rallyData.defaultProject = defaultProject;

		await mcpServer.connect(new StdioServerTransport());
		await new Promise(r => setTimeout(r, 400));
		console.error('IBM MCP Rally server started successfully');

	} catch (error) {
		console.error('Error starting IBM MCP Rally server:', error);
		process.exit(1);
	}
}

startServer();