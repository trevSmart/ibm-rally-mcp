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

export async function getTestCases({query, fetchSteps = false}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'testcase',
			fetch: ['FormattedID', 'Name', 'Description', 'Project', 'Iteration', 'Owner', 'State', 'TestCaseSteps', 'Objective', 'PreConditions', 'Type', 'Priority', 'c_APPGAR', 'c_Canal'],
		};

		if (query) {
			const rallyQueries = Object.keys(query).map( key => queryUtils.where(key, '=', query[key]));

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

		const testCases = await Promise.all(result.Results.map(async tc => {
			const testCase = {
				ObjectID: tc.ObjectID,
				FormattedID: tc.FormattedID,
				Name: tc.Name,
				State: tc.State,
				Description: stripDescriptionHtml ? stripHtmlTags(tc.Description) : tc.Description,
				Owner: tc.Owner
			};

			//Si fetchSteps és true o si només hi ha un test case, recuperem els steps
			if (fetchSteps || result.Results.length === 1) {
				try {
					//Recuperar els steps del test case
					const stepsResult = await rallyApi.query({
						type: 'testcasestep',
						fetch: ['StepIndex', 'Input', 'ExpectedResult'],
						query: queryUtils.where('TestCase', '=', tc._ref),
						order: 'StepIndex'
					});

					if (stepsResult.Results && stepsResult.Results.length > 0) {
						testCase.Steps = stepsResult.Results.map(step => ({
							StepIndex: step.StepIndex,
							Input: step.Input,
							ExpectedResult: step.ExpectedResult
						}));
					} else {
						testCase.Steps = [];
					}
				} catch (stepError) {
					//console.error(`Error recuperant steps per TC ${tc.FormattedID}: ${stepError.message}`);
					testCase.Steps = [];
					testCase.StepsError = stepError.message;
				}
			}

			return testCase;
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
	description: 'This tool retrieves a list of all test cases for a given user story. It can optionally include the test steps for each test case.',
	inputSchema: {
		query: z.object({
			Iteration: z.string().optional().describe('The iteration ObjectID to get test cases for. Example: /iteration/12345'),
			Project: z.string().optional().describe('The project ObjectID to get test cases for. Example: /project/12345'),
			Owner: z.string().optional().describe('The owner ObjectID to get test cases for. Example: /user/12345'),
			State: z.string().optional().describe('The state of the test cases to get. Example: "Draft"'),
			TestFolder: z.string().optional().describe('The test folder ObjectID to get test cases for. Example: /testfolder/12345')
		}).describe('A JSON object for filtering test cases. Only Iteration, Project, Owner, State and TestFolder fields are allowed. For example: `{"Iteration": "79965788689"}` to get test cases for a specific iteration. When filtering by a related entity, always use the ObjectID of the entity instead of the name.'),
		fetchSteps: z
			.boolean()
			.optional()
			.default(false)
			.describe('Whether to include test case steps in the response. Defaults to false. If only one test case is returned, steps are automatically included.')
	},
	annotations: {
		readOnlyHint: true
	}
};
