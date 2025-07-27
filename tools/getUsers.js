
import {getRallyApi, queryUtils} from './utils.js';

export default async function getUsers({query}) {
	const rallyApi = getRallyApi();

	try {
		const queryOptions = {
			type: 'user',
			fetch: ['ObjectID', 'UserName', 'DisplayName', 'EmailAddress', 'FirstName', 'LastName', 'Disabled'],
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
					text: 'No s\'han trobat usuaris a Rally.',
				}]
			};
		}

		const users = result.Results.map(user => ({
			ObjectID: user.ObjectID,
			UserName: user.UserName,
			DisplayName: user.DisplayName,
			EmailAddress: user.EmailAddress,
			FirstName: user.FirstName,
			LastName: user.LastName,
			Disabled: user.Disabled,
			_ref: user._ref
		}));

		return {
			content: [{
				type: 'text',
				text: `Usuaris trobats a Rally (${users.length}):\n\n${JSON.stringify(users, null, '\t')}`,
			}]
		};
	} catch (error) {
		console.error(`Error en getUsers: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getUsers: ${error.message}`,
			}]
		};
	}
}

export const getUsersTool = {
	name: 'getUsers',
	description: 'This tool retrieves a list of users from Rally.',
	inputSchema: {
		type: 'object',
		required: ['query'],
		properties: {
			query: {
				type: 'object',
				description: 'A JSON object for filtering users. Keys are field names and values are the values to match. For example: `{"DisplayName": "Marc Pla"}` to find a specific user by display name.',
				properties: {
					DisplayName: {
						type: 'string',
						description: 'The display name of the user. Example: "Marc Pla"'
					}
				}
			}
		},
		annotations: {
			readOnlyHint: true
		}
	}
};