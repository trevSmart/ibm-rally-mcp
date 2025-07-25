/*eslint-disable no-undef, no-console */
import {getRallyApi} from './utils.js';

export default async function updateTask({taskRef, updates}) {
    // Validate required fields
    if (!taskRef) {
        throw new Error('taskRef is required');
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        throw new Error('updates must be a non-empty object');
    }

    // If taskRef is a number (ObjectID), convert to ref
    if (!isNaN(taskRef) && !taskRef.startsWith('/task/')) {
        taskRef = `/task/${taskRef}`;
    }

    // Validate that taskRef looks like a valid Rally ref
    if (!taskRef.startsWith('/task/')) {
        throw new Error('Invalid taskRef: must be a valid task reference or ObjectID');
    }

    console.log(`Updating task ${taskRef} with updates:`, JSON.stringify(updates, null, 2));

    const rallyApi = getRallyApi();

    try {
        const result = await rallyApi.update({
            ref: taskRef,
            data: updates,
            fetch: ['FormattedID', 'Name', 'State'] // Fetch some basic fields
        });

        const updatedObject = result.Object;
        console.log(`Successfully updated task: ${updatedObject.FormattedID} - ${updatedObject.Name}`);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        FormattedID: updatedObject.FormattedID,
                        Name: updatedObject.Name,
                        State: updatedObject.State,
                        _ref: updatedObject._ref
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
}