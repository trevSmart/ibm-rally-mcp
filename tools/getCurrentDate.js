export async function getCurrentDate() {
	try {
		const now = new Date();

		const result = {
			now,
			nowLocaleString: now.toLocaleString(),
			nowIsoString: now.toISOString(),
			timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone
		};

		return {
			content: [{
				type: 'text',
				text: `Data i hora actual:\n\n${JSON.stringify(result, null, '\t')}`,
			}]
		};

	} catch (error) {
		// console.error(`Error en getCurrentDate: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getCurrentDate: ${error.message}`,
			}]
		};
	}
}

export const getCurrentDateTool = {
	name: 'getCurrentDate',
	title: 'Get Current Date',
	description: 'This tool retrieves the current date and time information.',
	inputSchema: {},
	annotations: {
		readOnlyHint: true
	}
};