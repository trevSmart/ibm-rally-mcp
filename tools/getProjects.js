import {getRallyApi, queryUtils} from './utils.js';

export default async function getProjects({query = {}}) {
	// console.error('query', query);
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'project',
			fetch: ['ObjectID', 'Name', 'Description', 'State', 'CreationDate', 'LastUpdateDate', 'Owner', 'Parent', 'Children']
		};

		if (Object.keys(query).length) {
			const rallyQueries = Object.keys(query).map(key => queryUtils.where(key, '=', query[key]));

			if (rallyQueries.length) {
				queryOptions.query = rallyQueries.reduce((a, b) => a.and(b));
			}
		}

		const result = await rallyApi.query(queryOptions);

		// console.error('Resultat de la consulta:', JSON.stringify(result, null, 2));

		if (!result.Results || result.Results.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat projectes actius a Rally.',
				}]
			};
		}

		//Formatem la resposta per ser més llegible
		const projects = result.Results.map(project => ({
			ObjectID: project.ObjectID,
			Name: project.Name,
			Description: project.Description || 'Sense descripció',
			State: project.State,
			CreationDate: project.CreationDate,
			LastUpdateDate: project.LastUpdateDate,
			Owner: project.Owner ? project.Owner._refObjectName : 'Sense propietari',
			Parent: project.Parent ? project.Parent._refObjectName : null,
			ChildrenCount: project.Children ? project.Children.Count : 0
		}));

		return {
			content: [{
				type: 'text',
				text: `Projectes actius trobats a Rally (${projects.length}):\n\n${JSON.stringify(projects, null, '\t')}`,
			}],
			structuredContent: projects
		};

	} catch (error) {
		// console.error(`Error en getProjects: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getProjects: ${error.message}`,
			}]
		};
	}
}

export const getProjectsTool = {
	name: 'getProjects',
	description: 'This tool retrieves a list of all active projects in Broadcom Rally.',
	inputSchema: {
		type: 'object',
		required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering projects. Keys are field names and values are the values to match. For example: `{"Name": "CSBD"}` to get the project with the name "CSBD".',
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};