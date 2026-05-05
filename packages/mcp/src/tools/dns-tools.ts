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

export const resolveDnsSchema = z.object({
    domain: z
        .string()
        .min(1)
        .describe(
            'DNS/domain name to resolve via TON DNS-compatible resolution (e.g., "foundation.ton" or "viqex.t.me")',
        ),
});

export const backResolveDnsSchema = z.object({
    address: z.string().min(1).describe('TON wallet address to reverse resolve'),
});

export function createMcpDnsTools(service: McpWalletService) {
    return {
        resolve_dns: {
            description:
                'Resolve a TON DNS-compatible domain name (e.g., "foundation.ton" or "viqex.t.me") to a wallet address. Use this when the user provides a domain instead of a raw address.',
            inputSchema: resolveDnsSchema,
            handler: async (args: z.infer<typeof resolveDnsSchema>): Promise<ToolResponse> => {
                try {
                    const address = await service.resolveDns(args.domain);

                    if (!address) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Could not resolve domain "${args.domain}". The domain may not exist or may not have a wallet record.`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        domain: args.domain,
                                        address,
                                    },
                                    null,
                                    2,
                                ),
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
                                    error: `Failed to resolve domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            },
        },

        back_resolve_dns: {
            description: 'Reverse resolve a TON wallet address to its associated DNS domain when available.',
            inputSchema: backResolveDnsSchema,
            handler: async (args: z.infer<typeof backResolveDnsSchema>): Promise<ToolResponse> => {
                try {
                    const domain = await service.backResolveDns(args.address);

                    if (!domain) {
                        return {
                            content: [
                                {
                                    type: 'text' as const,
                                    text: JSON.stringify({
                                        success: true,
                                        address: args.address,
                                        domain: null,
                                        message: 'No DNS domain found for this address.',
                                    }),
                                },
                            ],
                        };
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        address: args.address,
                                        domain,
                                    },
                                    null,
                                    2,
                                ),
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
                                    error: `Failed to reverse resolve address: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
