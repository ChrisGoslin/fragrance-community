// Using .js (CommonJS) so Jest can load this without ts-node.
// require() is intentional here — this file must be CJS so Jest can
// evaluate it before any transpiler is configured.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest.default({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
};

module.exports = createJestConfig(config);
