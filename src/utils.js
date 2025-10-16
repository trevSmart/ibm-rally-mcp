// Removed redundant globals directive to satisfy no-redeclare for process
import rally from 'ibm-rally-node';
import {log} from '../index.js';

export const {util: {query: queryUtils}} = rally;

export const getRallyApi = () => rally({
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
export async function getProjectId() {
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