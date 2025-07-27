import {mcpServer, rallyData} from '../index.js';
import {getRallyApi, queryUtils} from './utils.js';
import {z} from 'zod';

export async function getProjects({query = {}}) {
	const rallyApi = getRallyApi();

	try {
		// Si hi ha filtres específics, comprovem si podem satisfer-los amb la cache
		if (Object.keys(query).length > 0 && rallyData.projects?.length) {
			let filteredProjects = rallyData.projects.filter(project => {
				return Object.keys(query).every(key => {
					if (project[key] === undefined) return false;
					return project[key] === query[key];
				});
			});

			// Si tenim resultats que coincideixen amb els filtres, els retornem
			if (filteredProjects.length > 0) {
						return {
			content: [{
				type: 'text',
				text: `Projectes trobats a la cache (${filteredProjects.length}):\n\n${JSON.stringify(filteredProjects, null, '\t')}`,
			}],
			structuredContent: {
				projects: filteredProjects
			}
		};
			}
		}

		// Si no hi ha filtres (demandem tots els projectes) o no tenim dades suficients,
		// hem d'anar a l'API per obtenir la llista completa

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
		mcpServer.sendResourceListChanged();

		return {
			content: [{
				type: 'text',
				text: `Projectes actius trobats a Rally via API (${projects.length}):\n\n${JSON.stringify(projects, null, '\t')}`,
			}],
			structuredContent: {
				projects: projects
			}
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
	description: 'This tool queries active projects in Broadcom Rally that match the provided filters. If no filters are provided, it will return all projects.',
	inputSchema: {
		query: z
			.object({
				ObjectID: z.string().optional().describe('The ObjectID of the project to get.'),
				Name: z.string().optional().describe('The Name of the project to get.')
			})
			.describe('A JSON object for filtering projects. Only ObjectID and Name fields are allowed. For example: `{"Name": "CSBD"}` to get the project with the name "CSBD".')
	},
	annotations: {
		readOnlyHint: true
	}
};