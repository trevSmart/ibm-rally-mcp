import {rallyData} from '../index.js';
import {getRallyApi, queryUtils} from './utils.js';
import {z} from 'zod';

export async function getProjects({query = {}}) {
	const rallyApi = getRallyApi();

	try {
		// Comprovem si ja tenim projectes a rallyData i si coincideixen amb la consulta
		if (rallyData.projects.length > 0) {
			let filteredProjects = rallyData.projects;

			// Apliquem els filtres de la consulta si n'hi ha
			if (Object.keys(query).length > 0) {
				filteredProjects = rallyData.projects.filter(project => {
					return Object.keys(query).every(key => {
						if (project[key] === undefined) return false;
						return project[key] === query[key];
					});
				});
			}

			// Si tenim resultats, els retornem directament
			if (filteredProjects.length > 0) {
				return {
					content: [{
						type: 'text',
						text: `Projectes trobats a la cache (${filteredProjects.length}):\n\n${JSON.stringify(filteredProjects, null, '\t')}`,
					}],
					structuredContent: filteredProjects
				};
			}
		}

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

		if (!result.Results?.length) {
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
			Description: typeof project.Description === 'string'
				? project.Description.replace(/<[^>]*>/g, '')
				: project.Description,
			State: project.State,
			CreationDate: project.CreationDate,
			LastUpdateDate: project.LastUpdateDate,
			Owner: project.Owner ? project.Owner._refObjectName : 'Sense propietari',
			Parent: project.Parent ? project.Parent._refObjectName : null,
			ChildrenCount: project.Children ? project.Children.Count : 0
		}));

		// Afegim els nous projectes a rallyData sense duplicats
		projects.forEach(newProject => {
			const existingProjectIndex = rallyData.projects.findIndex(
				existingProject => existingProject.ObjectID === newProject.ObjectID
			);

			if (existingProjectIndex === -1) {
				// Projecte nou, l'afegim
				rallyData.projects.push(newProject);
			} else {
				// Projecte existent, l'actualitzem
				rallyData.projects[existingProjectIndex] = newProject;
			}
		});

		return {
			content: [{
				type: 'text',
				text: `Projectes actius trobats a Rally (${projects.length}):\n\n${JSON.stringify(projects, null, '\t')}`,
			}],
			structuredContent: projects
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

export const getProjectsTool = {
	name: 'getProjects',
	title: 'Get Projects',
	description: 'This tool retrieves a list of all active projects in Broadcom Rally.',
	inputSchema: {
		query: z
			.record(z.string())
			.optional()
			.default({})
			.describe('A JSON object for filtering projects. Keys are field names and values are the values to match. For example: `{"Name": "CSBD"}` to get the project with the name "CSBD".')
	},
	annotations: {
		readOnlyHint: true
	}
};