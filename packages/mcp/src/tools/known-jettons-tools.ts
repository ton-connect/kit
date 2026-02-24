/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { ToolResponse } from './types.js';

export const getKnownJettonsSchema = z.object({});

export const KNOWN_JETTONS = [
    {
        symbol: 'USD₮',
        name: 'Tether USD',
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6,
    },
    {
        symbol: 'NOT',
        name: 'Notcoin',
        address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
        decimals: 9,
    },
    {
        symbol: 'DOGS',
        name: 'Dogs',
        address: 'EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS',
        decimals: 9,
    },
    {
        symbol: 'DUST',
        name: 'DeDust',
        address: 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE',
        decimals: 9,
    },
    {
        symbol: 'GRAM',
        name: 'Gram',
        address: 'EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O',
        decimals: 9,
    },
] as const;

export function createMcpKnownJettonsTools() {
    return {
        get_known_jettons: {
            description:
                'Get a list of known/popular Jettons (tokens) on TON with their addresses and metadata. Useful for looking up token addresses for swaps or transfers.',
            inputSchema: getKnownJettonsSchema,
            handler: async (): Promise<ToolResponse> => {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    jettons: KNOWN_JETTONS,
                                    count: KNOWN_JETTONS.length,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },
    };
}
