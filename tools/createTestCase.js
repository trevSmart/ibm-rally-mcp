
import {getRallyApi} from './utils.js';
import {defaultProject} from '../index.js';

export default async function createTestCase({testCase}) {
    try {

        //Validate required fields
        const requiredFields = ['Name', 'UserStory', 'Steps'];
        const missingFields = requiredFields.filter(field => !testCase[field]);

        if (missingFields.length) {
            throw new Error(`Test case is missing required fields: ${missingFields.join(', ')}`);
        }

        //Validate that UserStory is a valid Rally object reference
        if (!testCase.UserStory.startsWith('/hierarchicalrequirement/')) {
            throw new Error('Invalid UserStory reference. Must start with /hierarchicalrequirement/');
        }

        //Validate that Steps is an array and has at least one step
        if (!Array.isArray(testCase.Steps) || testCase.Steps.length === 0) {
            throw new Error('Steps must be a non-empty array');
        }

        //Validate each step has required fields
        testCase.Steps.forEach((step, index) => {
            if (!step.Input || !step.ExpectedResult) {
                throw new Error(`Step ${index + 1} is missing required fields: Input and ExpectedResult`);
            }
        });

        console.error('Creating test case with data:', JSON.stringify(testCase, null, 2));

        const rallyApi = getRallyApi();

        //First, create the test case
        const testCaseData = {
            Name: testCase.Name,
            Description: testCase.Description || '',
            WorkProduct: testCase.UserStory, //Link to the user story
            Project: testCase.Project || defaultProject.ObjectID,
            Iteration: testCase.Iteration,
            Owner: testCase.Owner,
            Objective: testCase.Objective || testCase.Name,
            PreConditions: testCase.PreConditions || 'Probar con usuario de negocio',
            TestFolder: testCase.TestFolder,
            Type: 'Acceptance',
            Priority: 'Useful',
            c_APPGAR: 'APPCLD.CSBDSF',
            c_Canal: 'Salesforce'
        };

        //Add Project if provided
        if (testCase.Project) {
            testCaseData.Project = testCase.Project;
        }

        //Add Iteration if provided
        if (testCase.Iteration) {
            testCaseData.Iteration = testCase.Iteration;
        }

        //Add Owner if provided
        if (testCase.Owner) {
            testCaseData.Owner = testCase.Owner;
        }

        console.error('Creating test case with data:', JSON.stringify(testCaseData, null, 2));

        const testCaseResult = await rallyApi.create({
            type: 'testcase',
            data: testCaseData,
            fetch: ['FormattedID', 'Name', '_ref'],
            requestOptions: {}
        });

        const createdTestCase = testCaseResult.Object;
        console.error(`Successfully created test case: ${createdTestCase.FormattedID} - ${createdTestCase.Name}`);

        //Now create the test case steps
        const stepPromises = testCase.Steps.map((step, index) => {
            const stepData = {
                TestCase: createdTestCase._ref,
                StepIndex: index + 1,
                Input: step.Input,
                ExpectedResult: step.ExpectedResult
            };

            console.error(`Creating step ${index + 1} with data:`, JSON.stringify(stepData, null, 2));

            return rallyApi.create({
                type: 'testcasestep',
                data: stepData,
                fetch: ['StepIndex', 'Input', 'ExpectedResult'],
                requestOptions: {}
            });
        });

        const stepResults = await Promise.all(stepPromises);
        const createdSteps = stepResults.map(result => {
            const step = result.Object;
            console.error(`Successfully created step ${step.StepIndex}: ${step.Input}`);
            return {
                StepIndex: step.StepIndex,
                Input: step.Input,
                ExpectedResult: step.ExpectedResult
            };
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        TestCase: {
                            FormattedID: createdTestCase.FormattedID,
                            Name: createdTestCase.Name,
                            _ref: createdTestCase._ref
                        },
                        Steps: createdSteps,
                        TotalSteps: createdSteps.length
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error('Error creating test case:', error);
        throw error;
    }
}

export const createTestCaseTool = {
	name: 'createTestCase',
	description: 'This tool creates a new test case for a user story with N steps.',
	inputSchema: {
		type: 'object',
		required: ['testCase'],
		properties: {
			testCase: {
				type: 'object',
				description: 'The test case data to create. Must include Name, UserStory, and Steps.',
				required: ['Name', 'UserStory', 'Steps', 'Owner', 'TestFolder'],
				properties: {
					Name: {
						type: 'string',
						description: 'The name of the test case. Example: "Test login functionality"'
					},
					Description: {
						type: 'string',
						description: 'The description of the test case. Example: "Test case to verify user login functionality"'
					},
					UserStory: {
						type: 'string',
						description: 'The user story ObjectID to associate the test case with. Example: /hierarchicalrequirement/12345'
					},
					Project: {
						type: 'string',
						description: 'The project ObjectID to associate the test case with. Example: /project/12345'
					},
					Iteration: {
						type: 'string',
						description: 'The iteration ObjectID to associate the test case with. Example: /iteration/12345'
					},
					Owner: {
						type: 'string',
						description: 'The user ObjectID to associate the test case with. Example: /user/12345'
					},
					TestFolder: {
						type: 'string',
						description: 'The test folder ObjectID to associate the test case with. Example: /testfolder/12345'
					},
					Steps: {
						type: 'array',
						description: 'An array of test case steps. Each step must have Input and ExpectedResult.',
						items: {
							type: 'object',
							required: ['Input', 'ExpectedResult'],
							properties: {
								Input: {
									type: 'string',
									description: 'The input/action for this test step. Example: "Enter username in username field"'
								},
								ExpectedResult: {
									type: 'string',
									description: 'The expected result for this test step. Example: "Username field should be populated with entered value"'
								}
							}
						}
					}
				}
			}
		}
	}
};