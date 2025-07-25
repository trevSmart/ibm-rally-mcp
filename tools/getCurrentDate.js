/*eslint-disable no-console */

export default async function getCurrentDate() {
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
		console.error(`Error en getCurrentDate: ${error.message}`);
		return {
			isError: true,
			content: [{
				type: 'text',
				text: `Error en getCurrentDate: ${error.message}`,
			}]
		};
	}
}