import {getRallyApi, queryUtils} from '../utils.js';
import {rallyData} from '../../index.js';
import {z} from 'zod';

const stripDescriptionHtml = isTruthyEnv(process.env.STRIP_HTML_TESTCASE_DESCRIPTION);

function isTruthyEnv(value) {
	if (typeof value !== 'string') {
		return false;
	}
	return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function decodeBasicEntities(value) {
	return value
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&quot;/gi, '"');
}

function stripHtmlTags(value) {
	if (typeof value !== 'string' || value.length === 0) {
		return value;
	}
	const withNewlines = value
		.replace(/<\s*br\s*\/?\s*>/gi, '\n')
		.replace(/<\/(?:p|div|li|ul|ol|table|tr|td|th|h[1-6])\s*>/gi, '\n');
	const withoutTags = withNewlines.replace(/<[^>]*>/g, '');
	return decodeBasicEntities(withoutTags)
		.replace(/\r?\n{3,}/g, '\n\n')
		.trim();
}

function sanitizeRichText(value) {
	if (!stripDescriptionHtml) {
		return value;
	}
	return stripHtmlTags(value);
}

export async function getTestCases({query}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'testcase',
			fetch: ['FormattedID', 'Name', 'Description', 'Project', 'Iteration', 'State', 'Owner', 'Objective', 'PreConditions', 'Type', 'Priority', 'c_APPGAR', 'c_Canal', 'TestFolder'],
		};

		if (query) {
			const rallyQueries = Object.keys(query).map(key => {
				//Per al camp Name, utilitzem 'contains' per fer cerca parcial
				if (key === 'Name') {
					return queryUtils.where(key, 'contains', query[key]);
				}
				//Per a altres camps, mantenim la cerca exacta
				return queryUtils.where(key, '=', query[key]);
			});

			if (rallyQueries.length) {
				queryOptions.query = rallyQueries.reduce((a, b) => a.and(b));
			}
		}

		const result = await rallyApi.query(queryOptions);

		if (!result.Results || result.Results.length === 0) {
			return {
				content: [{
					type: 'text',
					text: 'No s\'han trobat test cases a Rally.',
				}]
			};
		}

		//console.error('result.Results');
		//console.error(JSON.stringify(result.Results, null, '\t'));

		const testCases = result.Results.map(tc => ({
			ObjectID: tc.ObjectID,
			FormattedID: tc.FormattedID,
			Name: tc.Name,
			State: tc.State,
			Description: sanitizeRichText(tc.Description),
			Owner: tc.Owner ? tc.Owner._refObjectName || tc.Owner : tc.Owner,
			Project: tc.Project ? tc.Project._refObjectName || tc.Project : tc.Project,
			Iteration: tc.Iteration ? tc.Iteration._refObjectName || tc.Iteration : tc.Iteration,
			TestFolder: tc.TestFolder ? tc.TestFolder._refObjectName || tc.TestFolder : tc.TestFolder,
			Objective: sanitizeRichText(tc.Objective),
			PreConditions: sanitizeRichText(tc.PreConditions),
			Type: tc.Type,
			Priority: tc.Priority,
			c_APPGAR: tc.c_APPGAR,
			c_Canal: tc.c_Canal
		}));

		return {
			content: [{
				type: 'text',
				text: `Test Cases: ${JSON.stringify(testCases, null, '\t')}`,
			}]
		};

	} catch (error) {
		//console.error(`Error in getTestCases: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error in getTestCases: ${error.message}`
			}]
		};
	}
}

export const getTestCasesTool = {
	name: 'getTestCases',
	title: 'Get Test Cases',
	description: 'This tool retrieves a list of test cases for a given filter without the associated steps. Use the getTestCaseSteps tool to retrieve detailed steps when needed.',
	inputSchema: {
		query: z.object({
			Iteration: z.string().optional().describe('The iteration ObjectID to get test cases for. Example: /iteration/12345'),
			Project: z.string().optional().describe('The project ObjectID to get test cases for. Example: /project/12345'),
			Owner: z.string().optional().describe('The owner ObjectID to get test cases for. Example: /user/12345'),
			State: z.string().optional().describe('The state of the test cases to get. Example: "Draft"'),
			TestFolder: z.string().optional().describe('The test folder ObjectID to get test cases for. Example: /testfolder/12345'),
			Name: z.string().optional().describe('The name of the test case to search for. Supports partial matching.'),
			FormattedID: z.string().optional().describe('The formatted ID of the test case to get. Example: "TC123"'),
			Type: z.string().optional().describe('The type of the test case to get. Example: "Functional"'),
			Priority: z.string().optional().describe('The priority of the test case to get. Example: "High"'),
			c_APPGAR: z.string().optional().describe('Custom field c_APPGAR value to filter by'),
			c_Canal: z.string().optional().describe('Custom field c_Canal value to filter by')
		}).describe('A JSON object for filtering test cases. Fields available: Iteration, Project, Owner, State, TestFolder, Name, FormattedID, Type, Priority, c_APPGAR, c_Canal. For example: `{"Iteration": "79965788689"}` to get test cases for a specific iteration. When filtering by a related entity, always use the ObjectID of the entity instead of the name.')
	},
	annotations: {
		readOnlyHint: true
	}
};
