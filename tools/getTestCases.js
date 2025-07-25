import {getRallyApi, queryUtils} from './utils.js';

export default async function getTestCases({query, includeSteps = false}) {
	const rallyApi = getRallyApi();

	try {

		const queryOptions = {
			type: 'testcase',
			fetch: ['FormattedID', 'Name', 'Description', 'Project', 'Iteration', 'Owner', 'State', 'TestCaseSteps'],
		};

		if (query) {
			const rallyQueries = Object.keys(query).map(key => queryUtils.where(key, '=', query[key]));

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

		console.error('result.Results');
		console.error(JSON.stringify(result.Results, null, '\t'));

		const testCases = await Promise.all(result.Results.map(async tc => {
			const testCase = {
				ObjectID: tc.ObjectID,
				FormattedID: tc.FormattedID,
				Name: tc.Name,
				State: tc.State,
				Description: tc.Description,
				Owner: tc.Owner ? tc.Owner._refObjectName : 'No Owner'
			};

			// Si includeSteps és true o si només hi ha un test case, recuperem els steps
			if (includeSteps || result.Results.length === 1) {
				try {
					// Recuperar els steps del test case
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
					console.error(`Error recuperant steps per TC ${tc.FormattedID}: ${stepError.message}`);
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
		console.error(`Error in getTestCases: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error in getTestCases: ${error.message}`
			}]
		};
	}
}