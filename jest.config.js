/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check
/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: './tests/.+\\.test\\.ts$',
}
