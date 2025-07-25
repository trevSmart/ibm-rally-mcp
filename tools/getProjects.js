import {getRallyApi} from './utils.js';

export default async function getProjects() {
	const rallyApi = getRallyApi();

	try {
		const result = await rallyApi.query({
			type: 'project',
			fetch: ['ObjectID', 'Name', 'Description', 'State', 'CreationDate', 'LastUpdateDate', 'Owner', 'Parent', 'Children'],
			//query: queryUtils.where('State', '=', 'Active')
		});

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
			}]
		};
	} catch (error) {
		console.error(`Error en getProjects: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getProjects: ${error.message}`,
			}]
		};
	}
}