import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import rally from 'rally';

// Configure Rally API
const rallyApi = rally({
    apiKey: process.env.RALLY_APIKEY,
    server: process.env.RALLY_INSTANCE,
    requestOptions: {
        headers: {
            'X-RallyIntegrationName': 'MCP Rally Server',
            'X-RallyIntegrationVendor': 'My company',
            'X-RallyIntegrationVersion': '1.0.0'
        }
    }
});

// Test case data equivalent to the tool input
const testCaseData = {
    Name: "Test MAC autenticacion con pasos - US1027350",
    Description: "Test case con 2 pasos para US1027350",
    WorkProduct: "/hierarchicalrequirement/77261079385", // Link to the user story
    Project: "/project/67423792989",
    Owner: "/user/66488625925",
    Objective: "Test MAC autenticacion con pasos - US1027350",
    PreConditions: "Probar con usuario de negocio",
    TestFolder: "/testfolder/80555580393",
    Type: "Acceptance",
    Priority: "Useful",
    c_APPGAR: "APPCLD.CSBDSF",
    c_Canal: "Salesforce"
};

// Steps data
const stepsData = [
    {
        TestCase: null, // Will be set after test case creation
        StepIndex: 1,
        Input: "Execute digital authentication for MAC opportunity",
        ExpectedResult: "Authentication process starts successfully"
    },
    {
        TestCase: null, // Will be set after test case creation
        StepIndex: 2,
        Input: "Complete level II authentication with OTP SMS",
        ExpectedResult: "OTP SMS is validated and opportunity can be processed"
    }
];

async function createTestCaseWithSteps() {
    try {
        console.log('Creating test case with data:', JSON.stringify(testCaseData, null, 2));

        // First, create the test case
        const testCaseResult = await rallyApi.create({
            type: 'testcase',
            data: testCaseData,
            fetch: ['FormattedID', 'Name', '_ref']
        });

        console.log('Test case created successfully:', JSON.stringify(testCaseResult, null, 2));

        const createdTestCase = testCaseResult.Object;
        console.log(`Successfully created test case: ${createdTestCase.FormattedID} - ${createdTestCase.Name}`);

        // Update steps with the test case reference
        const stepDataArray = stepsData.map(step => ({
            ...step,
            TestCase: createdTestCase._ref
        }));

        console.log('Creating steps with data:', JSON.stringify(stepDataArray, null, 2));

        // Create the test case steps in batch
        const stepResults = await rallyApi.create({
            type: 'testcasestep',
            data: stepDataArray,
            fetch: ['StepIndex', 'Input', 'ExpectedResult']
        });

        console.log('Steps created successfully:', JSON.stringify(stepResults, null, 2));

        // Handle both single result and array of results
        const resultsArray = Array.isArray(stepResults) ? stepResults : [stepResults];
        const createdSteps = resultsArray.map(result => {
            const step = result.Object;
            console.log(`Successfully created step ${step.StepIndex}: ${step.Input}`);
            return {
                StepIndex: step.StepIndex,
                Input: step.Input,
                ExpectedResult: step.ExpectedResult
            };
        });

        console.log('Final result:', {
            TestCase: createdTestCase,
            Steps: createdSteps,
            TotalSteps: createdSteps.length
        });

    } catch (error) {
        console.error('Error creating test case:', error);
        throw error;
    }
}

// Execute the script
createTestCaseWithSteps()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
