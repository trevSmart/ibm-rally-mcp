
import {getUserStories} from '../rallyServices.js';
import {z} from 'zod';

export async function getUserStoriesTool({query}) {
	try {
		const result = await getUserStories(query);

		if (!result.userStories || result.userStories.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat user stories a Rally.',
				}]
			};
		}

		return {
			content: [{
				type: 'text',
				text: `${result.userStories.length} user stories (${result.source}): ${JSON.stringify(result.userStories, null, '\t')}`,
			}]
		};

	} catch (error) {
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getUserStories: ${error.message}`
			}]
		};
	}
}

export const getUserStoriesToolDefinition = {
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