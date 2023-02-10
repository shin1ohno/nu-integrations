export default {
    preset: 'ts-jest/presets/default-esm',
    transform: {
        '^.+\\.m?ts?$': ['ts-jest', { useESM: true }],
    },
    testEnvironment: 'node',
    roots: ["<rootDir>"],
    modulePaths: ["src"],
    moduleNameMapper: {
        "^@shin1ohno/nuroon-connectors/(.+)": "<rootDir>/src/app/$1",
        '^(\\.{1,2}/.*)\\.(m)?js$': '$1'
    },
    testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(m)?ts$',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.mts',
        '!src/**/*.d.ts',
        '!src/**/*.d.mts',
        '!src/index.ts'
    ],
}
