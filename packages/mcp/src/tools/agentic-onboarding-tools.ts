/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { AgenticOnboardingService } from '../services/AgenticOnboardingService.js';
import {
    sanitizeAgenticRootWalletSetupStatus,
    sanitizePrivateKeyBackedValue,
    sanitizeStoredWallet,
} from './sanitize.js';
import { wrapToolHandler } from './responses.js';

const startAgenticRootWalletSetupSchema = z.object({
    network: z.enum(['mainnet', 'testnet']).optional().describe('Network for the new root wallet (default: mainnet)'),
    name: z.string().optional().describe('Optional agent display name'),
    source: z.string().optional().describe('Optional source / description'),
    collectionAddress: z.string().optional().describe('Optional collection address override'),
    tonDeposit: z.string().optional().describe('Optional TON deposit hint for the dashboard'),
});

const setupIdSchema = z.object({
    setupId: z.string().min(1).describe('Pending setup identifier'),
});

const completeAgenticRootWalletSetupSchema = z.object({
    setupId: z.string().min(1).describe('Pending setup identifier'),
    walletAddress: z.string().optional().describe('Manually supplied wallet address if no callback was received'),
    ownerAddress: z.string().optional().describe('Optional owner address hint for validation'),
});

export function createMcpAgenticOnboardingTools(onboarding: AgenticOnboardingService) {
    return {
        start_agentic_root_wallet_setup: {
            description:
                'Start first-root-agent setup: generate operator keys, persist a pending draft, and return dashboard and callback URLs. Agents with shell/browser access should open the dashboard URL. Waiting for callback_received applies to long-lived stdio/HTTP server sessions; raw CLI should complete manually with walletAddress.',
            inputSchema: startAgenticRootWalletSetupSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof startAgenticRootWalletSetupSchema>) => {
                const result = await onboarding.startRootWalletSetup(args);
                return {
                    ...result,
                    pendingDeployment: sanitizePrivateKeyBackedValue(result.pendingDeployment),
                };
            }),
        },

        list_pending_agentic_root_wallet_setups: {
            description: 'List pending root-agent onboarding drafts and their callback/session status.',
            inputSchema: z.object({}),
            handler: wrapToolHandler(async () => {
                const setups = await onboarding.listRootWalletSetups();
                return {
                    setups: setups.map((setup) => sanitizeAgenticRootWalletSetupStatus(setup)),
                    count: setups.length,
                };
            }),
        },

        get_agentic_root_wallet_setup: {
            description: 'Get one pending root-agent onboarding draft by setup id.',
            inputSchema: setupIdSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof setupIdSchema>) => {
                const setup = await onboarding.getRootWalletSetup(args.setupId);
                return { setup: sanitizeAgenticRootWalletSetupStatus(setup) };
            }),
        },

        complete_agentic_root_wallet_setup: {
            description:
                'Complete root-agent onboarding from callback payload or manually supplied wallet address, then import the resulting wallet and make it active.',
            inputSchema: completeAgenticRootWalletSetupSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof completeAgenticRootWalletSetupSchema>) => {
                const result = await onboarding.completeRootWalletSetup(args);
                return {
                    ...result,
                    wallet: sanitizeStoredWallet(result.wallet),
                };
            }),
        },

        cancel_agentic_root_wallet_setup: {
            description: 'Cancel a pending root-agent onboarding draft and remove its pending state.',
            inputSchema: setupIdSchema,
            handler: wrapToolHandler(async (args: z.infer<typeof setupIdSchema>) => {
                await onboarding.cancelRootWalletSetup(args.setupId);
                return { setupId: args.setupId, cancelled: true };
            }),
        },
    };
}
