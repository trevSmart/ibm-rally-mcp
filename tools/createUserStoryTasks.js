/*eslint-disable no-undef, no-console */
import {getRallyApi} from './utils.js';

export default async function createUserStoryTasks({tasks = []}) {

	//Validate required fields for each task
	const requiredFields = ['Project', 'WorkProduct', 'Name', 'Description'];

	tasks.forEach((task, i) => {
		const missingFields = requiredFields.filter(field => !task[field]);

		if (missingFields.length) {
			throw new Error(`Task at index ${i} is missing required fields: ${missingFields.join(', ')}`);
		}

		//Validate that Project and WorkProduct are valid Rally object references
		if (!task.Project.startsWith('/project/')) {
			throw new Error(`Task at index ${i} has invalid Project reference: ${task.Project}`);
		}

		if (!task.WorkProduct.startsWith('/hierarchicalrequirement/')) {
			throw new Error(`Task at index ${i} has invalid WorkProduct reference: ${task.WorkProduct}`);
		}
	});

	console.log(`Validation passed for ${tasks.length} tasks`);

	const rallyApi = getRallyApi();

	const createPromises = tasks.map(taskData => {
		console.error('Creating task with data:', JSON.stringify(taskData, null, 2));
		return rallyApi.create({
			type: 'task',
			data: taskData,
			fetch: ['Name']
		});
	});

	return Promise.all(createPromises)
		.then(results => {
			console.log('All tasks created successfully:');
			const output = results.map(result => {
				const createdObject = result.Object;
				console.log(`Successfully created task: ${createdObject.FormattedID} - ${createdObject.Name}`);
				return {
					FormattedID: createdObject.FormattedID,
					Name: createdObject.Name,
					_ref: createdObject._ref
				};
			});

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(output, null, 2)
					}
				]
			};
		})
		.catch(error => {
			console.error('One or more tasks could not be created.', error);
			throw error;
		});
}