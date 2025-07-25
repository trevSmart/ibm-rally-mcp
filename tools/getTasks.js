import {getRallyApi, queryUtils} from './utils.js';

export default async function getTasks({query}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'task',
			fetch: ['FormattedID', 'Name', 'State', 'Estimate', 'ToDo', 'Owner', 'WorkProduct'],
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
					text: 'No s\'han trobat tasques a Rally.',
				}]
			};
		}

		const tasks = result.Results.map(task => ({
			ObjectID: task.ObjectID,
			Name: task.Name,
			State: task.State,
			Estimate: task.Estimate,
			ToDo: task.ToDo,
			Owner: task.Owner ? task.Owner._refObjectName : 'No Owner',
			WorkProduct: task.WorkProduct._refObjectName
		}));
		return {
			content: [{
				type: 'text',
				text: `Tasques: ${JSON.stringify(tasks, null, '\t')}`,
			}]
		};

	} catch (error) {
		console.error(`Error in getTasks: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error in getTasks: ${error.message}`
			}]
		};
	}
}