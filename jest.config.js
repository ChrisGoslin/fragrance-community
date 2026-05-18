// Using .js (CommonJS) so Jest can load this without ts-node
const nextJest = require('next/jest');

const createJestConfig = nextJest.default({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
};

module.exports = createJestConfig(config);
