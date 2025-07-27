
import {getRallyApi, queryUtils} from './utils.js';
import {z} from 'zod';

export async function getUserStories({query}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'hierarchicalrequirement',
			fetch: ['FormattedID', 'Name', 'Description', 'Project', 'Iteration', 'Blocked', 'TaskEstimateTotal', 'ToDo', 'Owner', 'State', 'PlanEstimate', 'TaskStatus', 'Tasks', 'TestCases', 'Defects', 'Discussion', 'ObjectID', 'c_Appgar'],
		};

		if (query) {
			const rallyQueries = Object.keys(query).map(key => queryUtils.where(key, '=', query[key]));

			if (rallyQueries.length) {
				queryOptions.query = rallyQueries.reduce((a, b) => a.and(b));
			}
		}

		const result = await rallyApi.query(queryOptions);

		if (!result.Results || result.Results.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat user stories a Rally.',
				}]
			};
		}

		// console.error('result.Results');
		// console.error(JSON.stringify(result.Results, null, '\t'));

		const userStories = result.Results.map(us => ({
			ObjectID: us.ObjectID,
			FormattedID: us.FormattedID,
			Name: us.Name,
			State: us.State,
			PlanEstimate: us.PlanEstimate,
			ToDo: us.ToDo,
			Owner: us.Owner._refObjectName,
		}));
		return {
			content: [{
				type: 'text',
				text: `Històries d'usuari de la iteració: ${JSON.stringify(userStories, null, '\t')}"`,
			}]
		};

	} catch (error) {
		// console.error(`Error en getUserStories: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getUserStories: ${error.message}`
			}]
		};
	}
}

export const getUserStoriesTool = {
	name: 'getUserStories',
	title: 'Get User Stories',
	description: 'This tool retrieves details about the user stories of the given iteration (sprint).',
	inputSchema: {
		query: z
			.record(z.string())
			.optional()
			.describe('A JSON object for filtering user stories. Keys are field names and values are the values to match. For example: `{"State": "Accepted", "Iteration.ObjectID": "12345"}`. When filtering by a related entity, always use the ObjectID of the entity instead of the name.')
	},
	annotations: {
		readOnlyHint: true
	}
};