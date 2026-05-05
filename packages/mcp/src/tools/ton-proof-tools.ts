/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { McpWalletService } from '../services/McpWalletService.js';
import type { ToolResponse } from './types.js';

export const generateTonProofSchema = z.object({
    domain: z.string().min(1).describe('Domain to generate the proof for (e.g., "getgems.io")'),
    payload: z.string().min(1).describe('Payload string required by the verifying service (e.g., "getgems-llm")'),
});

export function createMcpTonProofTools(service: McpWalletService) {
    return {
        generate_ton_proof: {
            description:
                'Generate a signed TonConnect proof-of-ownership for the active wallet. ' +
                'Used to authenticate with third-party services that accept TonProof (e.g., GetGems API). ' +
                'Returns the full proof payload ready to POST to the service.',
            inputSchema: generateTonProofSchema,
            handler: async (args: z.infer<typeof generateTonProofSchema>): Promise<ToolResponse> => {
                try {
                    const proof = await service.generateTonProof(args.domain, args.payload);

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({ success: true, proof }, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: `Failed to generate TonProof: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            },
        },
    };
}
