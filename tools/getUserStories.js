/*eslint-disable no-console */
import {getRallyApi, queryUtils} from './utils.js';

export default async function getUserStories({query}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'hierarchicalrequirement',
			fetch: ['FormattedID', 'Name', 'Description', 'Project', 'Iteration', 'Blocked', 'TaskEstimateTotal', 'ToDo', 'Owner', 'State', 'PlanEstimate', 'TaskStatus', 'Tasks', 'TestCases', 'Defects', 'Discussion', 'ObjectID'],
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

		console.error('result.Results');
		console.error(JSON.stringify(result.Results, null, '\t'));

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
		console.error(`Error en getUserStories: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getUserStories: ${error.message}`
			}]
		};
	}
}