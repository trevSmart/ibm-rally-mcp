import {mcpServer, client, logLevel} from '../index.js';

export async function log(data, level = logLevel) {
	if (typeof data === 'object') {
		data = JSON.stringify(data);
	}
	if (typeof data === 'string') {
		if (data.length > 4000) {
			data = data.slice(0, 3997) + '...';
		}
		data = '\n' + data + '\n';
	}

	try {
		if (clientSupportsCapability('logging')) {
			await mcpServer.server.sendLoggingMessage({level: level, logger: 'MCP server', data});
		}
	} catch (error) {
		console.error(error);
	}
}

export function clientSupportsCapability(capabilityName) {
	switch (capabilityName) {
		case 'resources':
			return client.capabilities.resources;

		case 'embeddedResources':
			return client.capabilities.embeddedResources;

		case 'resourceLinks':
			return false;

		default:
			return Boolean(client.capabilities[capabilityName]);
	}
}
