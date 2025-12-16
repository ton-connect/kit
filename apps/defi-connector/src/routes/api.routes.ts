/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { StonFiService } from '../services/stonfi.service.js';
import type { Action, ApiMeta, SwapInput } from '../types/api.js';

const router: Router = Router();
const stonFiService = new StonFiService();

// Validation schemas using Zod
const TokenRefSchema = z.object({
    standard: z.enum(['jetton', 'ton']),
    address: z.string(),
    decimals: z.number(),
    symbol: z.string(),
});

const SwapInputSchema = z.object({
    amount_in: z.string().regex(/^[0-9]+$/),
    token_in: TokenRefSchema,
    token_out: TokenRefSchema,
    wallet_address: z.string(),
    slippage_bps: z.string().optional(),
    chain_id: z.number(),
    use_gasless: z.boolean().optional(),
    excess_address: z.string().optional(),
    referrer: z.string().optional(),
    client: z
        .object({
            name: z.string(),
            version: z.string(),
        })
        .optional(),
    idempotency_key: z.string().optional(),
});

// GET /api/ton/meta
router.get('/meta', (_req: Request, res: Response) => {
    const meta: ApiMeta = {
        spec: 'UTD-API',
        version: '0.3.0',
        name: 'STON.fi DeFi Connector',
        chain_id: 1, // TON mainnet
        supported_chain_ids: [1, 2], // mainnet and testnet
        contact: {
            email: 'contact@example.com',
        },
        docs_url: 'https://docs.ston.fi/developer-section/dex/sdk',
    };

    res.json(meta);
});

// GET /api/ton/actions
router.get('/actions', (_req: Request, res: Response) => {
    const actions: Action[] = [
        {
            id: 'swap',
            category: 'defi',
            title: 'Swap Tokens',
            version: '2.0.0',
            input_schema: {
                type: 'object',
                required: ['amount_in', 'token_in', 'token_out', 'wallet_address', 'chain_id'],
                properties: {
                    amount_in: { type: 'string', pattern: '^[0-9]+$' },
                    token_in: { $ref: '#/components/schemas/TokenRef' },
                    token_out: { $ref: '#/components/schemas/TokenRef' },
                    wallet_address: { type: 'string' },
                    slippage_bps: { type: 'string' },
                    chain_id: { type: 'integer' },
                    use_gasless: { type: 'boolean' },
                    excess_address: { type: 'string' },
                },
            },
            output_schema: {
                $ref: '#/components/schemas/SwapQuote',
            },
            quote_url: '/api/ton/actions/swap/quote',
            ui_hints: {
                title: 'Swap Tokens on STON.fi',
                description: 'Exchange tokens using STON.fi DEX',
            },
        },
    ];

    res.json({ actions });
});

// POST /api/ton/actions/{action_id}/quote
router.post('/actions/:action_id/quote', async (req: Request, res: Response) => {
    try {
        const { action_id } = req.params;

        if (action_id !== 'swap') {
            return res.status(404).json({
                error: {
                    code: 'ACTION_NOT_FOUND',
                    message: `Action ${action_id} not supported`,
                },
            });
        }

        // Validate input
        const validation = SwapInputSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Invalid input parameters',
                    details: validation.error.issues,
                },
            });
        }

        const swapInput: SwapInput = validation.data;
        const quote = await stonFiService.getSwapQuote(swapInput);

        res.json(quote);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Quote error:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Internal server error',
            },
        });
    }
});

export default router;
