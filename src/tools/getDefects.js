import {getRallyApi} from '../utils.js';
import {z} from 'zod';

export async function getDefects({query, project}) {
	try {
		const rallyApi = getRallyApi();

		// Build the query parameters
		const queryParams = {
			type: 'defect',
			fetch: ['FormattedID', 'Name', 'State', 'Severity', 'Priority', 'Description', 'Owner', 'Project', 'Iteration', 'CreationDate', 'LastUpdateDate'],
			limit: 200
		};

		// Build query filters - always include project filter
		const queryFilters = {
			Project: project
		};

		// Add additional query filters if provided
		if (query && Object.keys(query).length > 0) {
			Object.assign(queryFilters, query);
		}

		queryParams.query = queryFilters;

		const result = await rallyApi.query(queryParams);

		if (!result.Results || result.Results.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat defects a Rally.'
				}]
			};
		}

		// Format the results
		const defects = result.Results.map(defect => ({
			FormattedID: defect.FormattedID,
			Name: defect.Name,
			State: defect.State,
			Severity: defect.Severity,
			Priority: defect.Priority,
			Description: defect.Description,
			Owner: defect.Owner ? defect.Owner._refObjectName : null,
			Project: defect.Project ? defect.Project._refObjectName : null,
			Iteration: defect.Iteration ? defect.Iteration._refObjectName : null,
			CreationDate: defect.CreationDate,
			LastUpdateDate: defect.LastUpdateDate,
			_ref: defect._ref
		}));

		return {
			content: [{
				type: 'text',
				text: `${defects.length} defects trobats: ${JSON.stringify(defects, null, '\t')}`
			}]
		};

	} catch (error) {
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getDefects: ${error.message}`
			}]
		};
	}
}

export const getDefectsToolDefinition = {
	name: 'getDefects',
	title: 'Get Defects',
	description: 'This tool retrieves a list of defects from Rally.',
	inputSchema: {
		project: z
			.string()
			.describe('The project ObjectID to get defects for. Example: /project/12345'),
		query: z
			.record(z.string())
			.optional()
			.describe('A JSON object for filtering defects. Keys are field names and values are the values to match. For example: `{"State": "Open", "Severity": "High"}`. When filtering by a related entity, always use the ObjectID of the entity instead of the name.')
	},
	annotations: {
		readOnlyHint: true
	}
};
