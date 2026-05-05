/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../utils/cli-args.js';

describe('cli args utils', () => {
    it('keeps string amounts as strings', () => {
        const parsed = parseCliArgs(['--amount', '0.1'], {
            type: 'object',
            properties: {
                amount: { type: 'string' },
            },
        });

        expect(parsed).toEqual({ amount: '0.1' });
    });

    it('coerces numeric scalars when schema expects numbers', () => {
        const parsed = parseCliArgs(['--limit', '5', '--offset', '0'], {
            type: 'object',
            properties: {
                limit: { type: 'number' },
                offset: { type: 'integer' },
            },
        });

        expect(parsed).toEqual({ limit: 5, offset: 0 });
    });

    it('coerces booleans inside parsed json objects', () => {
        const parsed = parseCliArgs(['--metadata', '{"enabled":"false","retries":"3","name":"bot"}'], {
            type: 'object',
            properties: {
                metadata: {
                    type: 'object',
                    properties: {
                        enabled: { type: 'boolean' },
                        retries: { type: 'integer' },
                        name: { type: 'string' },
                    },
                },
            },
        });

        expect(parsed).toEqual({
            metadata: {
                enabled: false,
                retries: 3,
                name: 'bot',
            },
        });
    });

    it('supports nested anyOf scalar coercion inside additionalProperties', () => {
        const parsed = parseCliArgs(['--metadata', '{"enabled":"false","retries":"3","label":"bot"}'], {
            type: 'object',
            properties: {
                metadata: {
                    type: 'object',
                    additionalProperties: {
                        anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'boolean' }],
                    },
                },
            },
        });

        expect(parsed).toEqual({
            metadata: {
                enabled: false,
                retries: 3,
                label: 'bot',
            },
        });
    });
});
