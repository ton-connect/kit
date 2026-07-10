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

export const getLimitsSchema = z.object({});

export function createMcpLimitsTools(service: McpWalletService) {
    return {
        get_limits: {
            description:
                'Get the active agentic-wallet spend limits and usage: per asset and rolling window, the configured ' +
                'cap, amount already spent, and remaining headroom (base units; window 0 = per-transaction). Returns ' +
                'enabled:false when the wallet is not agentic or has no verifiable on-chain limits.',
            inputSchema: getLimitsSchema,
            handler: async (): Promise<ToolResponse> => {
                try {
                    const info = await service.getLimitsInfo();
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({ success: true, ...info }, null, 2),
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
                                    error: `Failed to get spend limits: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
