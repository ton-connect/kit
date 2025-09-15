import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.spec.ts'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: false,
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    testTimeout: 10000,
    verbose: true,
    silent: false,
};

export default config;
