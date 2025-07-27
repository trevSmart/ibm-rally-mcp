
import {getRallyApi} from './utils.js';
import {rallyData} from '../index.js';
import {z} from 'zod';

export async function createTestCase({testCase}) {
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
            Project: testCase.Project || rallyData.defaultProject.ObjectID,
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
	title: 'Create Test Case',
	description: 'This tool creates a new test case for a user story with N steps.',
	inputSchema: {
		testCase: z
			.object({
				Name: z.string().describe('The name of the test case. Example: "Test login functionality"'),
				Description: z.string().optional().describe('The description of the test case. Example: "Test case to verify user login functionality"'),
				UserStory: z.string().describe('The user story ObjectID to associate the test case with. Example: /hierarchicalrequirement/12345'),
				Project: z.string().optional().describe('The project ObjectID to associate the test case with. Example: /project/12345'),
				Iteration: z.string().optional().describe('The iteration ObjectID to associate the test case with. Example: /iteration/12345'),
				Owner: z.string().describe('The user ObjectID to associate the test case with. Example: /user/12345'),
				TestFolder: z.string().describe('The test folder ObjectID to associate the test case with. Example: /testfolder/12345'),
				Steps: z
					.array(z.object({
						Input: z.string().describe('The input/action for this test step. Example: "Enter username in username field"'),
						ExpectedResult: z.string().describe('The expected result for this test step. Example: "Username field should be populated with entered value"')
					}))
					.describe('An array of test case steps. Each step must have Input and ExpectedResult.')
			})
			.describe('The test case data to create. Must include Name, UserStory, and Steps.')
	}
};