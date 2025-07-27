
import {getRallyApi} from './utils.js';
import {defaultProject} from '../index.js';

export default async function createUserStory({userStory}) {
    //Validate required fields
    const requiredFields = ['Project', 'Name', 'Description'];
    const missingFields = requiredFields.filter(field => !userStory[field]);

    if (missingFields.length) {
        throw new Error(`User story is missing required fields: ${missingFields.join(', ')}`);
    }

    //Validate that Project is a valid Rally object reference
    if (!userStory.Project.startsWith('/project/')) {
        throw new Error('Invalid Project reference');
    }

    //Validate that Iteration is a valid Rally object reference if provided
    if (userStory.Iteration && !userStory.Iteration.startsWith('/iteration/')) {
        throw new Error('Invalid Iteration reference');
    }

    // console.error('Creating user story with data:', JSON.stringify(userStory, null, 2));

    const rallyApi = getRallyApi();

    try {
        //Prepare data object with required fields
        const data = {
            Name: userStory.Name,
            Description: userStory.Description,
            Project: userStory.Project || defaultProject.ObjectID,
            Owner: userStory.Owner,
            c_APPGAR: 'APPCLD.CSBDSF',
            c_Canal: 'Salesforce',
            c_Tipo: '72219812153' //Desarrollo
        };

        //Add Iteration if provided
        if (userStory.Iteration) {
            data.Iteration = userStory.Iteration;
        }

        //Add Owner if provided
        if (userStory.Owner) {
            data.Owner = userStory.Owner;
        }

        //Try without scope first, using the exact structure from documentation
        const result = await rallyApi.create({
            type: 'hierarchicalrequirement',
            data: data,
            fetch: ['FormattedID', 'Name'],
            requestOptions: {}
        });

        const createdObject = result.Object;
        console.error(`Successfully created user story: ${createdObject.FormattedID} - ${createdObject.Name}`);

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

export const createUserStoryTool = {
	name: 'createUserStory',
	description: 'This tool creates a new user story in Rally.',
	inputSchema: {
		type: 'object',
		required: ['userStory'],
		properties: {
			userStory: {
				type: 'object',
				description: 'The user story data to create. Must include Project, Name, and Description.',
				required: ['Project', 'Name', 'Description', 'Iteration', 'Owner'],
				properties: {
					Project: {
						type: 'string',
						description: 'The project ObjectID to associate the user story with. Example: /project/12345'
					},
					Name: {
						type: 'string',
						description: 'The name of the user story. Example: "User story title"'
					},
					Description: {
						type: 'string',
						description: 'The description of the user story. Example: "User story description"'
					},
					Iteration: {
						type: 'string',
						description: 'The iteration ObjectID to associate the user story with. Example: /iteration/12345'
					},
					Owner: {
						type: 'string',
						description: 'The user ObjectID to associate the user story with. Example: /user/12345'
					}

				}
			}
		}
	}
};