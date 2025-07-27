import dotenv from 'dotenv';
dotenv.config();
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

//Tools
import getProjects from './tools/getProjects.js';
import getIterations from './tools/getIterations.js';
import getUserStories from './tools/getUserStories.js';
import getTasks from './tools/getTasks.js';
import getTestCases from './tools/getTestCases.js';
import getTypeDefinition from './tools/getTypeDefinition.js';
import createUserStoryTasks from './tools/createUserStoryTasks.js';
import getCurrentDate from './tools/getCurrentDate.js';
import updateTask from './tools/updateTask.js';
import createUserStory from './tools/createUserStory.js';
import createDefect from './tools/createDefect.js';
import createTestCase from './tools/createTestCase.js';
import getUsers from './tools/getUsers.js';
import getTestFolders from './tools/getTestFolders.js';

//Tool definitions
import { getProjectsTool } from './tools/getProjects.js';
import { getIterationsTool } from './tools/getIterations.js';
import { getUserStoriesTool } from './tools/getUserStories.js';
import { getTasksTool } from './tools/getTasks.js';
import { getTestCasesTool } from './tools/getTestCases.js';
import { getTypeDefinitionTool } from './tools/getTypeDefinition.js';
import { createUserStoryTasksTool } from './tools/createUserStoryTasks.js';
import { getCurrentDateTool } from './tools/getCurrentDate.js';
import { updateTaskTool } from './tools/updateTask.js';
import { createUserStoryTool } from './tools/createUserStory.js';
import { createDefectTool } from './tools/createDefect.js';
import { createTestCaseTool } from './tools/createTestCase.js';
import { getUsersTool } from './tools/getUsers.js';
import { getTestFoldersTool } from './tools/getTestFolders.js';

//Variable global per emmagatzemar l'ID del projecte
export let defaultProject = null;



const server = new Server(
	{
		name: 'rally-mcp',
		version: '1.0.0',
	},
	{
		capabilities: {
			logging: {},
			tools: {
				getProjectsTool,
				getIterationsTool,
				getUserStoriesTool,
				getTasksTool,
				getTestCasesTool,
				getTypeDefinitionTool,
				createUserStoryTasksTool,
				getCurrentDateTool,
				updateTaskTool,
				createUserStoryTool,
				createDefectTool,
				createTestCaseTool,
				getUsersTool,
				getTestFoldersTool
			}
		}
	}
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		getProjectsTool,
		getIterationsTool,
		getUserStoriesTool,
		getTasksTool,
		getTestCasesTool,
		getTypeDefinitionTool,
		createUserStoryTasksTool,
		getCurrentDateTool,
		updateTaskTool,
		createUserStoryTool,
		createDefectTool,
		createTestCaseTool,
		getUsersTool,
		getTestFoldersTool
	]
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
	const { name, arguments: args } = request.params;

	try {
		let result;

		if (name === 'getProjects') {
			result = await getProjects(args);
		} else if (name === 'getIterations') {
			result = await getIterations({ ...args });
		} else if (name === 'getUserStories') {
			result = await getUserStories({ ...args });
		} else if (name === 'getTasks') {
			result = await getTasks({ ...args });
		} else if (name === 'getTestCases') {
			result = await getTestCases({ ...args });
		} else if (name === 'getTypeDefinition') {
			result = await getTypeDefinition({ ...args });
		} else if (name === 'createUserStoryTasks') {
			result = await createUserStoryTasks({ ...args });
		} else if (name === 'getCurrentDate') {
			result = await getCurrentDate();
		} else if (name === 'updateTask') {
			result = await updateTask(args);
		} else if (name === 'createUserStory') {
			result = await createUserStory(args);
		} else if (name === 'createDefect') {
			result = await createDefect(args);
		} else if (name === 'createTestCase') {
			result = await createTestCase(args);
		} else if (name === 'getUsers') {
			result = await getUsers(args);
		} else if (name === 'getTestFolders') {
			result = await getTestFolders(args);
		} else {
			throw new Error(`Unknown tool: ${name}`);
		}

		if (result && result.content) {
			return result;
		}

		return {
			content: [{
				type: 'text',
				text: JSON.stringify(result, null, 2)
			}]
		};

	} catch (error) {
		// console.error(`Error executing ${name}:`, error);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `❌ Error executing ${name}: ${error.message}`
			}]
		};
	}
});

const transport = new StdioServerTransport();

async function startServer() {
	try {
		//Obtenim l'ID del projecte abans d'iniciar el servidor
		const result = await getProjects({ query: { Name: process.env.RALLY_PROJECT_NAME } });

		if (result.isError) {
			throw new Error(`Error obtenint projectes: ${result.content[0].text}`);
		}

		if (!result.structuredContent || result.structuredContent.length === 0) {
			throw new Error('No s\'han trobat projectes per inicialitzar el servidor');
		}

		defaultProject = JSON.parse(result.structuredContent[0].ObjectID);
		// console.error(`Projecte inicialitzat amb ID: ${defaultProject}`);

		await server.connect(transport);
		// console.error('IBM MCP Rally server started successfully');
	} catch (error) {
		// console.error('Error starting IBM MCP Rally server:', error);
		process.exit(1);
	}
}

startServer();