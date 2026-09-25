/**
 * Vitest global setup file (referenced by vitest.config.js `setupFiles`).
 *
 * Kept dependency-free on purpose: vitest.config.js loads this file for every
 * run, so it must resolve using only the dependencies declared in
 * client/package.json. Importing a package that is not declared (for example
 * `@testing-library/jest-dom`) makes `npm test` fail with
 * "Failed to resolve import" before any test file is even collected.
 *
 * When component tests need jest-dom matchers (toBeInTheDocument, ...):
 *   1. npm install -D @testing-library/jest-dom   (run inside client/)
 *   2. add `import '@testing-library/jest-dom';` below
 * Do not add the import before the dependency (and its lockfile entry) exists.
 */
export {};
