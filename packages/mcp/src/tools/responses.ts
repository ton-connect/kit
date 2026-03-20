/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToolResponse } from './types.js';

export function wrapToolHandler<TArgs>(
    handler: (args: TArgs) => Promise<unknown>,
): (args: TArgs) => Promise<ToolResponse> {
    return async (args: TArgs): Promise<ToolResponse> => {
        try {
            const data = await handler(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ success: true, ...((data as object | null) ?? {}) }, null, 2),
                    },
                ],
            };
        } catch (error) {
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
    };
}
