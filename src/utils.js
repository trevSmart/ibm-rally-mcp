/*globals process */
import rally from 'rally';
import {mcpServer} from '../index.js';

const {util: {query: queryUtils}} = rally;

const getRallyApi = () => rally({
	apiKey: process.env.RALLY_APIKEY,
	server: process.env.RALLY_INSTANCE,
	requestOptions: {
		headers: {
			'X-RallyIntegrationName': 'MCP Rally Server',
			'X-RallyIntegrationVendor': 'My company',
			'X-RallyIntegrationVersion': '1.0.0'
		}
	}
});

/**
 * Obté l'ID del projecte especificat a la variable d'entorn RALLY_PROJECT
 * @returns {Promise<string>} - L'ID del projecte
 */
async function getProjectId() {
	if (!process.env.RALLY_PROJECT_NAME) {
		throw new Error('No s\'ha trobat la variable d\'entorn RALLY_PROJECT_NAME');
	}

	const rallyApi = getRallyApi();

	const result = await rallyApi.query({
		type: 'project',
		fetch: ['ObjectID', 'Name'],
		query: queryUtils.where('Name', '=', process.env.RALLY_PROJECT_NAME)
	});

	if (!result.Results || result.Results.length === 0) {
		throw new Error(`No s'ha trobat cap projecte amb el nom "${process.env.RALLY_PROJECT_NAME}"`);
	}

	log(`Projecte trobat: ${JSON.stringify(result.Results[0], null, '\t')}`);
	return result.Results[0].ObjectID;
}


export async function log(data, logLevel = 'info') {
	if (typeof data === 'object') {
		data = JSON.stringify(data);
	}
	if (typeof data === 'string') {
		if (data.length > 4000) {
			data = data.slice(0, 3997) + '...';
		}
		data = '\n' + data + '\n';
	}

	try {
		await mcpServer.server.sendLoggingMessage({level: logLevel, logger: 'MCP server', data});
	} catch (error) {
		console.error(error);
	}
}

export {getProjectId, getRallyApi, queryUtils};