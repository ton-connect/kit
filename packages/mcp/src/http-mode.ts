/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface HttpSessionServerInstance {
    server: McpServer;
    close: () => Promise<void>;
}

export interface HttpMcpSessionRouterOptions {
    host: string;
    port: number;
    createServerInstance: () => Promise<HttpSessionServerInstance>;
    handleExtraRequest?: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
}

interface ActiveSession extends HttpSessionServerInstance {
    transport: StreamableHTTPServerTransport;
}

function getHeaderValue(req: IncomingMessage, name: string): string | undefined {
    const header = req.headers[name];
    return Array.isArray(header) ? header[0] : header;
}

async function closeSession(session: ActiveSession): Promise<void> {
    await Promise.allSettled([session.server.close(), session.close()]);
}

export function createHttpMcpSessionRouter(options: HttpMcpSessionRouterOptions) {
    const sessions = new Map<string, ActiveSession>();

    const cleanupSession = async (sessionId?: string) => {
        if (!sessionId) {
            return;
        }
        const session = sessions.get(sessionId);
        if (!session) {
            return;
        }
        sessions.delete(sessionId);
        await closeSession(session);
    };

    return {
        async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
            if (options.handleExtraRequest && (await options.handleExtraRequest(req, res))) {
                return;
            }

            const url = new URL(req.url ?? '/', `http://${options.host}:${options.port}`);
            if (url.pathname !== '/mcp') {
                res.writeHead(404).end('Not Found');
                return;
            }

            const sessionId = getHeaderValue(req, 'mcp-session-id');
            if (sessionId) {
                const existingSession = sessions.get(sessionId);
                if (!existingSession) {
                    res.writeHead(404, { 'content-type': 'application/json' }).end(
                        JSON.stringify({ error: 'Unknown MCP session' }),
                    );
                    return;
                }

                await existingSession.transport.handleRequest(req, res);
                return;
            }

            const instance = await options.createServerInstance();
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
            });

            transport.onclose = () => {
                void cleanupSession(transport.sessionId);
            };

            await instance.server.connect(transport);

            try {
                await transport.handleRequest(req, res);
            } catch (error) {
                await closeSession({
                    ...instance,
                    transport,
                });
                throw error;
            }

            if (!transport.sessionId) {
                await closeSession({
                    ...instance,
                    transport,
                });
                return;
            }

            sessions.set(transport.sessionId, {
                ...instance,
                transport,
            });
        },

        async close(): Promise<void> {
            const currentSessions = [...sessions.values()];
            sessions.clear();
            await Promise.allSettled(currentSessions.map((session) => closeSession(session)));
        },

        getSessionCount(): number {
            return sessions.size;
        },
    };
}
