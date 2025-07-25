/*eslint-disable no-undef, no-console */
import {getRallyApi} from './utils.js';

export default async function createUserStory({userStory}) {
    // Validate required fields
    const requiredFields = ['Project', 'Name', 'Description'];
    const missingFields = requiredFields.filter(field => !userStory[field]);

    if (missingFields.length) {
        throw new Error(`User story is missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate that Project is a valid Rally object reference
    if (!userStory.Project.startsWith('/project/')) {
        throw new Error('Invalid Project reference');
    }

    // Validate that Iteration is a valid Rally object reference if provided
    if (userStory.Iteration && !userStory.Iteration.startsWith('/iteration/')) {
        throw new Error('Invalid Iteration reference');
    }

    console.log('Creating user story with data:', JSON.stringify(userStory, null, 2));

    const rallyApi = getRallyApi();

    try {
        // Prepare data object with required fields
        const data = {
            Name: userStory.Name,
            Description: userStory.Description,
            Project: userStory.Project
        };

        // Add Iteration if provided
        if (userStory.Iteration) {
            data.Iteration = userStory.Iteration;
        }

        // Add Owner if provided
        if (userStory.Owner) {
            data.Owner = userStory.Owner;
        }

        // Try without scope first, using the exact structure from documentation
        const result = await rallyApi.create({
            type: 'hierarchicalrequirement',
            data: data,
            fetch: ['FormattedID', 'Name'],
            requestOptions: {}
        });

        const createdObject = result.Object;
        console.log(`Successfully created user story: ${createdObject.FormattedID} - ${createdObject.Name}`);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        FormattedID: createdObject.FormattedID,
                        Name: createdObject.Name,
                        _ref: createdObject._ref
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error('Error creating user story:', error);
        throw error;
    }
}