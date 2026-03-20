/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { TonConnectRuntimeService } from '../services/TonConnectRuntimeService.js';
import type { ToolResponse } from './types.js';

function successResponse(data: unknown): ToolResponse {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, ...((data as object | null) ?? {}) }, null, 2),
            },
        ],
    };
}

function errorResponse(error: unknown): ToolResponse {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(
                    {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                    null,
                    2,
                ),
            },
        ],
        isError: true,
    };
}

export const tonconnectHandleUrlSchema = z.object({
    url: z.string().min(1).describe('TonConnect universal link or raw TonConnect URL.'),
});

export const tonconnectListRequestsSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'expired', 'failed']).optional().describe('Optional status filter'),
    type: z.enum(['connect', 'sendTransaction', 'signData']).optional().describe('Optional request type filter'),
    limit: z.number().min(1).max(100).optional().describe('Maximum number of requests to return'),
});

export const tonconnectApproveRequestSchema = z.object({
    requestId: z.string().min(1).describe('TonConnect request identifier'),
});

export const tonconnectRejectRequestSchema = z.object({
    requestId: z.string().min(1).describe('TonConnect request identifier'),
    reason: z.string().optional().describe('Optional rejection reason'),
});

export const tonconnectDisconnectSchema = z.object({
    sessionId: z.string().optional().describe('Optional TonConnect session id. Disconnects all sessions when omitted.'),
});

const emptySchema = z.object({});

export function createMcpTonConnectTools(getRuntime: () => Promise<TonConnectRuntimeService>) {
    const withRuntime = async <T>(operation: (runtime: TonConnectRuntimeService) => Promise<T>): Promise<ToolResponse> => {
        try {
            return successResponse(await operation(await getRuntime()));
        } catch (error) {
            return errorResponse(error);
        }
    };

    return {
        tonconnect_handle_url: {
            description: 'Handle a TonConnect universal link or raw TonConnect URL and enqueue the resulting request.',
            inputSchema: tonconnectHandleUrlSchema,
            handler: async (args: z.infer<typeof tonconnectHandleUrlSchema>): Promise<ToolResponse> =>
                withRuntime((runtime) => runtime.handleUrl(args.url)),
        },

        tonconnect_list_requests: {
            description: 'List pending and recent TonConnect requests for the selected wallet runtime.',
            inputSchema: tonconnectListRequestsSchema,
            handler: async (args: z.infer<typeof tonconnectListRequestsSchema>): Promise<ToolResponse> =>
                withRuntime(async (runtime) => {
                    const requests = await runtime.listRequests(args);
                    return {
                        requests,
                        count: requests.length,
                    };
                }),
        },

        tonconnect_approve_request: {
            description: 'Approve a pending TonConnect connect, sendTransaction, or signData request.',
            inputSchema: tonconnectApproveRequestSchema,
            handler: async (args: z.infer<typeof tonconnectApproveRequestSchema>): Promise<ToolResponse> =>
                withRuntime((runtime) => runtime.approveRequest(args.requestId)),
        },

        tonconnect_reject_request: {
            description: 'Reject a pending TonConnect connect, sendTransaction, or signData request.',
            inputSchema: tonconnectRejectRequestSchema,
            handler: async (args: z.infer<typeof tonconnectRejectRequestSchema>): Promise<ToolResponse> =>
                withRuntime(async (runtime) => ({
                    request: await runtime.rejectRequest(args.requestId, args.reason),
                })),
        },

        tonconnect_list_sessions: {
            description: 'List active TonConnect sessions without exposing session private keys.',
            inputSchema: emptySchema,
            handler: async (_args: z.infer<typeof emptySchema>): Promise<ToolResponse> =>
                withRuntime(async (runtime) => {
                    const sessions = await runtime.listSessions();
                    return {
                        sessions,
                        count: sessions.length,
                    };
                }),
        },

        tonconnect_disconnect: {
            description: 'Disconnect one TonConnect session or all sessions for the selected wallet runtime.',
            inputSchema: tonconnectDisconnectSchema,
            handler: async (args: z.infer<typeof tonconnectDisconnectSchema>): Promise<ToolResponse> =>
                withRuntime((runtime) => runtime.disconnect(args.sessionId)),
        },

        tonconnect_get_status: {
            description: 'Return TonConnect runtime status, storage path, request counts, and active session count.',
            inputSchema: emptySchema,
            handler: async (_args: z.infer<typeof emptySchema>): Promise<ToolResponse> =>
                withRuntime(async (runtime) => ({
                    status: await runtime.getStatus(),
                })),
        },
    };
}

export function createDisabledTonConnectTools(reason: string) {
    return createMcpTonConnectTools(async () => {
        throw new Error(reason);
    });
}
