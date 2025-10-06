import dotenv from 'dotenv';

// Set NODE_ENV to test to prevent server startup during tests
process.env.NODE_ENV = 'test';

// Load environment variables from .env file before running tests
dotenv.config();

// Ensure any library that relies on console.log/info/debug writes to stderr so test output stays clean
const originalConsoleError = console.error.bind(console);
const redirectStdoutToStderr = (...args) => {
	originalConsoleError(...args);
};

console.log = redirectStdoutToStderr;
console.info = redirectStdoutToStderr;
console.debug = redirectStdoutToStderr;
