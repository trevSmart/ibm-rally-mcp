import dotenv from 'dotenv';
dotenv.config();

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {InitializeRequestSchema, SetLevelRequestSchema} from '@modelcontextprotocol/sdk/types.js';

//Tools
import {getProjectsToolDefinition, getProjectsTool} from './src/tools/getProjects.js';
import {getIterations, getIterationsTool} from './src/tools/getIterations.js';
import {getUserStoriesToolDefinition, getUserStoriesTool} from './src/tools/getUserStories.js';
import {getTasks, getTasksTool} from './src/tools/getTasks.js';
import {getTestCases, getTestCasesTool} from './src/tools/getTestCases.js';
import {getTypeDefinition, getTypeDefinitionTool} from './src/tools/getTypeDefinition.js';
import {createUserStoryTasks, createUserStoryTasksTool} from './src/tools/createUserStoryTasks.js';
import {getCurrentDate, getCurrentDateTool} from './src/tools/getCurrentDate.js';
import {updateTask, updateTaskTool} from './src/tools/updateTask.js';
import {createUserStory, createUserStoryTool} from './src/tools/createUserStory.js';
import {createDefect, createDefectTool} from './src/tools/createDefect.js';
import {createTestCase, createTestCaseTool} from './src/tools/createTestCase.js';
import {getUsersToolDefinition, getUsersTool} from './src/tools/getUsers.js';
import {getTestFolders, getTestFoldersTool} from './src/tools/getTestFolders.js';
import {getTestCaseSteps, getTestCaseStepsTool} from './src/tools/getTestCaseSteps.js';
import {rallyMcpServerUtilsToolDefinition, rallyMcpServerUtilsTool} from './src/tools/rallyMcpServerUtils.js';
import {createNewUserStoryPrompt, createNewUserStoryPromptDefinition} from './src/prompts/createNewUserStory.js';

import {getProjects, getUserStories, getUsers} from './src/rallyServices.js';
import {log, clientSupportsCapability} from './src/utils.js';

const serverConfig = {
	protocolVersion: '2025-06-18',
	serverInfo: {
		name: 'rally-mcp',
		version: '1.0.0'
	},
	capabilities: {
		logging: {},
		resources: {listChanged: true},
		prompts: {listChanged: true},
		tools: {},
		completions: {}
	}
};

export let logLevel = 'info';

export const mcpServer = new McpServer(serverConfig.serverInfo, {capabilities: {}});

export let client = {capabilities: {}};

export async function sendElicitRequest(elicitationProperties) {
	if ('elicitation' in client.capabilities) {
		const elicitationResult = await mcpServer.server.elicitInput({
			message: elicitatcionProperties.description,
			requestedSchema: {
				type: 'object',
				properties: elicitationProperties,
				required: ['confirmation']
			}
		});
		return elicitationResult;
	}
}

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

mcpServer.server.setRequestHandler(InitializeRequestSchema, async request => {
	try {
		logLevel = process.env.LOG_LEVEL || 'info';

		client = request.params;
		log(`Client capabilities: ${JSON.stringify(client.capabilities, null, 3)}`, 'debug');

		if (clientSupportsCapability('logging')) {
			mcpServer.server.setRequestHandler(SetLevelRequestSchema, async ({params}) => {
				logLevel = params.level;
				return {};
			});
		}

		return {
			protocolVersion: serverConfig.protocolVersion,
			serverInfo: serverConfig.serverInfo,
			capabilities: serverConfig.capabilities
		};

	} catch (error) {
		console.error(`Error initializing server: ${error.message}` );
		throw error;
	}
});
mcpServer.registerPrompt('createNewUserStory', createNewUserStoryPromptDefinition, createNewUserStoryPrompt);
mcpServer.registerTool('getProjects', getProjectsToolDefinition, getProjectsTool);
mcpServer.registerTool('getIterations', getIterationsTool, getIterations);
mcpServer.registerTool('getUserStories', getUserStoriesToolDefinition, getUserStoriesTool);
mcpServer.registerTool('getTasks', getTasksTool, getTasks);
mcpServer.registerTool('getTestCases', getTestCasesTool, getTestCases);
mcpServer.registerTool('getTypeDefinition', getTypeDefinitionTool, getTypeDefinition);
mcpServer.registerTool('createUserStoryTasks', createUserStoryTasksTool, createUserStoryTasks);
mcpServer.registerTool('getCurrentDate', getCurrentDateTool, getCurrentDate);
mcpServer.registerTool('updateTask', updateTaskTool, updateTask);
mcpServer.registerTool('createUserStory', createUserStoryTool, createUserStory);
mcpServer.registerTool('createDefect', createDefectTool, createDefect);
mcpServer.registerTool('createTestCase', createTestCaseTool, createTestCase);
mcpServer.registerTool('getUsers', getUsersToolDefinition, getUsersTool);
mcpServer.registerTool('getTestFolders', getTestFoldersTool, getTestFolders);
mcpServer.registerTool('getTestCaseSteps', getTestCaseStepsTool, getTestCaseSteps);
mcpServer.registerTool('rallyMcpServerUtils', rallyMcpServerUtilsToolDefinition, rallyMcpServerUtilsTool);

async function startServer() {
	try {
		//Obtenim l'ID del projecte abans d'iniciar el servidor
		const getProjectsResult = await getProjects({Name: process.env.RALLY_PROJECT_NAME});
		if (!getProjectsResult.projects || getProjectsResult.projects.length === 0) {
			throw new Error(`Error obtenint projecte per defecte: No s'han trobat projectes amb el nom ${process.env.RALLY_PROJECT_NAME}`);
		}
		const defaultProject = getProjectsResult.projects[0];
		console.error(`Projecte per defecte: ${JSON.stringify(defaultProject, null, 3)}`);

		const getUserStoriesResult = await getUserStories({Project: `/project/${defaultProject.ObjectID}`, Owner: 'currentuser'}, 1);
		console.error(`User stories: ${JSON.stringify(getUserStoriesResult, null, 3)}`);
		const owner = getUserStoriesResult.userStories[0].Owner;
		console.error(`Owner: ${owner}`);
		const getUsersResult = await getUsers({DisplayName: owner}, 1);
		console.error(`Users: ${JSON.stringify(getUsersResult, null, 3)}`);
		rallyData.currentUser = getUsersResult.users[0];

		mcpServer.registerResource('rallyData', 'mcp://data/all.json', {
			title: 'All Rally Data',
			description: 'All data from Rally',
			mimeType: 'application/json',
			annotations: {audience: ['user', 'assistant'], lastModified: new Date().toISOString() }
		},	async uri => ({contents: [{uri: uri, text: JSON.stringify(rallyData, null, 3)}]}));

		mcpServer.registerResource('defaultProject', 'mcp://projects/default.json', {
			title: defaultProject.Name,
			description: defaultProject.Description,
			mimeType: 'application/json',
			annotations: {audience: ['user', 'assistant'], lastModified: new Date().toISOString()}
		},	async uri => ({contents: [{uri: uri, text: JSON.stringify(defaultProject, null, 3)}]}));
		mcpServer.sendResourceListChanged();

		rallyData.defaultProject = defaultProject;

		await mcpServer.connect(new StdioServerTransport());
		await new Promise(r => setTimeout(r, 400));
		console.error('IBM MCP Rally server started successfully');

	} catch (error) {
		console.error('Error starting IBM MCP Rally server:', error );
		process.exit(1);
	}
}

startServer();