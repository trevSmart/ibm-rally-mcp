import {getRallyApi, queryUtils} from './utils.js';

export default async function getIterations({query}) {
	const rallyApi = getRallyApi();

	try {
		const queryOptions = {
			type: 'iteration',
			fetch: ['ObjectID', 'Name', 'StartDate', 'EndDate', 'State', 'Project'],
		};

		if (query) {
			const rallyQueries = Object.keys(query).map(key => queryUtils.where(key, '=', query[key]));

			if (rallyQueries.length > 0) {
				queryOptions.query = rallyQueries.reduce((a, b) => a.and(b));
			}
		}

		const result = await rallyApi.query(queryOptions);

		if (!result.Results || result.Results.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat iteracions a Rally.',
				}]
			};
		}

		const iterations = result.Results.map(iteration => ({
			ObjectID: iteration.ObjectID,
			Name: iteration.Name,
			State: iteration.State,
			StartDate: iteration.StartDate,
			EndDate: iteration.EndDate,
			Project: iteration.Project._refObjectName,
		}));

		return {
			content: [{
				type: 'text',
				text: `Iteracions trobades a Rally (${iterations.length}):\n\n${JSON.stringify(iterations, null, '\t')}`,
			}]
		};
	} catch (error) {
		console.error(`Error en getIterations: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getIterations: ${error.message}`,
			}]
		};
	}
}