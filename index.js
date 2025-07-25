/*globals require, process */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {ListToolsRequestSchema, CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js';

//Tools
import getProjects from './tools/getProjects.js';
import getIterations from './tools/getIterations.js';
import getUserStories from './tools/getUserStories.js';
import getTasks from './tools/getTasks.js';
import getTestCases from './tools/getTestCases.js';
import getTypeDefinition from './tools/getTypeDefinition.js';
import createUserStoryTasks from './tools/createUserStoryTasks.js';
import getCurrentDate from './tools/getCurrentDate.js';

//Variable global per emmagatzemar l'ID del projecte
let projectId;

//Tools
const getIterationsTool = {
	name: 'getIterations',
	description: 'This tool retrieves a list of all iterations (sprints) for the configured project.',
	inputSchema: {
		type: 'object',
		required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering iterations. Keys are field names and values are the values to match. For example: `{"State": "Accepted", "Project.ObjectID": "12345"}`. When filtering by a related entity, always use the ObjectID of the entity instead of the name.',
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};

const getUserStoriesTool = {
	name: 'getUserStories',
	description: 'This tool retrieves details about the user stories of the given iteration (sprint).',
	inputSchema: {
		type: 'object',
		required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering user stories. Keys are field names and values are the values to match. For example: `{"State": "Accepted", "Iteration.ObjectID": "12345"}`. When filtering by a related entity, always use the ObjectID of the entity instead of the name.',
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};

const getProjectsTool = {
	name: 'getProjects',
	description: 'This tool retrieves a list of all active projects in Broadcom Rally.',
	inputSchema: {
		type: 'object',
		properties: {},
		annotations: {
			readOnlyHint: true
		}
	}
};

const getTasksTool = {
	name: 'getTasks',
	description: 'This tool retrieves a list of all tasks for a given user story.',
	inputSchema: {
		type: 'object',
		required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering tasks. Keys are field names and values are the values to match. For example: `{"WorkProduct.ObjectID": "12345"}` to get tasks for a specific user story. When filtering by a related entity, always use the ObjectID of the entity instead of the name.',
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};

const getTestCasesTool = {
	name: 'getTestCases',
	description: 'This tool retrieves a list of all test cases for a given user story. It can optionally include the test steps for each test case.',
	inputSchema: {
		type: 'object',
		//required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering test cases. Keys are field names and values are the values to match. For example: `{"Iteration.ObjectID": "79965788689"}` to get test cases for a specific user story. When filtering by a related entity, always use the ObjectID of the entity instead of the name.',
			},
			includeSteps: {
				type: 'boolean',
				description: 'Whether to include test case steps in the response. Defaults to false. If only one test case is returned, steps are automatically included.'
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};

const createUserStoryTasksTool = {
	name: 'createUserStoryTasks',
	description: 'This tool creates one or more tasks for a user story.',
	inputSchema: {
		type: 'object',
		required: ['tasks'],
		properties: {
			tasks: {
				type: 'array',
				description: 'An array of task objects to be created. Each object must contain the necessary fields for a task.',
				items: {
					type: 'object'
				}
			}
		}
	}
};

const getTypeDefinitionTool = {
	name: 'getTypeDefinition',
	description: 'This tool retrieves object model metadata from Rally.',
	inputSchema: {
		type: 'object',
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering type definitions. Keys are field names and values are the values to match. For example: `{"Name": "Defect"}`.'
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};

const getCurrentDateTool = {
	name: 'getCurrentDate',
	description: 'This tool retrieves the current date and time information.',
	inputSchema: {
		type: 'object',
		properties: {},
		annotations: {
			readOnlyHint: true
		}
	}
};

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
		getCurrentDateTool
	]
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
	const {name, arguments: args} = request.params;

	try {
		let result;

		if (name === 'getProjects') {
			result = await getProjects();
		} else if (name === 'getIterations') {
			const finalProjectId = args.projectId || projectId;
			result = await getIterations({...args, projectId: finalProjectId});
		} else if (name === 'getUserStories') {
			result = await getUserStories({...args});
		} else if (name === 'getTasks') {
			result = await getTasks({...args});
		} else if (name === 'getTestCases') {
			result = await getTestCases({...args});
		} else if (name === 'getTypeDefinition') {
			result = await getTypeDefinition({...args});
		} else if (name === 'createUserStoryTasks') {
			result = await createUserStoryTasks({...args});
		} else if (name === 'getCurrentDate') {
			result = await getCurrentDate();
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
		if (error.message.includes('No s\'ha trobat cap iteració amb el nom')) {
			return {
				content: [{
					type: 'text',
					text: `No s'ha trobat cap iteració amb el nom "${args.iterationName}".`
				}]
			};
		}

		console.error(`Error executing ${name}:`, error);
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
		//projectId = await getProjectId();
		console.error(`Projecte inicialitzat amb ID: ${projectId}`);

		await server.connect(transport);
		console.error('IBM MCP Rally server started successfully');
	} catch (error) {
		console.error('Error starting IBM MCP Rally server:', error);
		process.exit(1);
	}
}

startServer();