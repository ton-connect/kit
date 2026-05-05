/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';

import type { PendingAgenticDeployment, StoredAgenticWallet } from '../registry/config.js';
import { AgenticOnboardingService } from '../services/AgenticOnboardingService.js';
import type { AgenticSetupSession } from '../services/AgenticSetupSessionManager.js';
import { AgenticWalletValidationError } from '../utils/agentic.js';

describe('AgenticOnboardingService', () => {
    const pendingDeployment: PendingAgenticDeployment = {
        id: 'setup-1',
        network: 'mainnet',
        operator_private_key: '0xpriv',
        operator_public_key: '0xfeed',
        name: 'Agent Alpha',
        source: 'MCP flow',
        collection_address: 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07',
        created_at: '2026-03-10T00:00:00.000Z',
        updated_at: '2026-03-10T00:00:00.000Z',
    };

    const completedWallet: StoredAgenticWallet = {
        id: 'agent-1',
        type: 'agentic',
        name: 'Agent Alpha',
        network: 'mainnet',
        address: 'UQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwnZF',
        owner_address: 'UQAcIXCxCd_gAqQ8RK0UA9vvlVA7wWjV41l2URKVxaMVLeM5',
        operator_private_key: '0xpriv',
        operator_public_key: '0xfeed',
        source: 'MCP flow',
        collection_address: 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07',
        created_at: '2026-03-10T00:00:00.000Z',
        updated_at: '2026-03-10T00:00:00.000Z',
    };

    function createSession(
        overrides: Partial<AgenticSetupSession> & Pick<AgenticSetupSession, 'status'>,
    ): AgenticSetupSession {
        return {
            setupId: pendingDeployment.id,
            callbackUrl: 'http://127.0.0.1:3000/agentic/callback/setup-1',
            createdAt: '2026-03-10T00:00:00.000Z',
            expiresAt: '2026-03-11T00:00:00.000Z',
            ...overrides,
        };
    }

    function createDeps() {
        const registry = {
            createPendingAgenticSetup: vi.fn(),
            listPendingAgenticSetups: vi.fn(),
            getPendingAgenticSetup: vi.fn(),
            validateAgenticWallet: vi.fn(),
            completePendingAgenticSetup: vi.fn(),
            removePendingAgenticSetup: vi.fn(),
        };
        const sessionManager = {
            createSession: vi.fn(),
            getSession: vi.fn(),
            markCompleted: vi.fn(),
            cancelSession: vi.fn(),
        };

        return {
            registry,
            sessionManager,
            service: new AgenticOnboardingService(registry as never, sessionManager as never),
        };
    }

    it('starts setup, persists a pending draft, and returns a dashboard link', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.createPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.createSession.mockResolvedValue(
            createSession({
                status: 'pending',
            }),
        );

        const result = await service.startRootWalletSetup({
            network: 'mainnet',
            name: 'Agent Alpha',
            source: 'MCP flow',
            tonDeposit: '0.2',
        });

        expect(registry.createPendingAgenticSetup).toHaveBeenCalledWith({
            network: 'mainnet',
            operatorPrivateKey: expect.stringMatching(/^0x[0-9a-f]+$/i),
            operatorPublicKey: expect.stringMatching(/^0x[0-9a-f]+$/i),
            name: 'Agent Alpha',
            source: 'MCP flow',
            collectionAddress: undefined,
        });
        expect(sessionManager.createSession).toHaveBeenCalledWith(pendingDeployment.id);
        expect(result).toMatchObject({
            setupId: pendingDeployment.id,
            network: 'mainnet',
            pendingDeployment,
            callbackUrl: 'http://127.0.0.1:3000/agentic/callback/setup-1',
        });
        expect(result.dashboardUrl).toContain('/create?');
    });

    it('lists and gets setup statuses with callback-backed session state', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.listPendingAgenticSetups.mockResolvedValue([pendingDeployment]);
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(
            createSession({
                status: 'callback_received',
                payload: {
                    event: 'agent_wallet_deployed',
                    network: { chainId: '-239' },
                    wallet: {
                        address: completedWallet.address,
                        ownerAddress: completedWallet.owner_address,
                    },
                },
            }),
        );

        const list = await service.listRootWalletSetups();
        const single = await service.getRootWalletSetup(pendingDeployment.id);

        expect(list).toHaveLength(1);
        expect(list[0]).toMatchObject({
            setupId: pendingDeployment.id,
            status: 'callback_received',
        });
        expect(single).toMatchObject({
            setupId: pendingDeployment.id,
            status: 'callback_received',
            session: expect.objectContaining({
                status: 'callback_received',
            }),
        });
    });

    it('falls back to manual completion when no callback payload exists', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(createSession({ status: 'pending' }));
        registry.validateAgenticWallet.mockResolvedValue({
            address: completedWallet.address,
            ownerAddress: completedWallet.owner_address,
            collectionAddress: completedWallet.collection_address,
            operatorPublicKey: completedWallet.operator_public_key,
            deployedByUser: true,
        });
        registry.completePendingAgenticSetup.mockResolvedValue(completedWallet);

        const result = await service.completeRootWalletSetup({
            setupId: pendingDeployment.id,
            walletAddress: completedWallet.address,
            ownerAddress: completedWallet.owner_address,
        });

        expect(registry.validateAgenticWallet).toHaveBeenCalledWith({
            address: completedWallet.address,
            network: 'mainnet',
            collectionAddress: pendingDeployment.collection_address,
            ownerAddress: completedWallet.owner_address,
        });
        expect(registry.completePendingAgenticSetup).toHaveBeenCalledWith({
            setupId: pendingDeployment.id,
            validatedWallet: expect.objectContaining({
                address: completedWallet.address,
                deployedByUser: true,
            }),
            name: undefined,
            source: undefined,
        });
        expect(sessionManager.markCompleted).toHaveBeenCalledWith(pendingDeployment.id);
        expect(result).toEqual({
            wallet: completedWallet,
            resolvedWalletAddress: completedWallet.address,
            usedCallbackPayload: false,
        });
    });

    it('prefers callback payload data during completion when walletAddress is omitted', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(
            createSession({
                status: 'callback_received',
                payload: {
                    event: 'agent_wallet_deployed',
                    network: { chainId: '-239' },
                    wallet: {
                        address: completedWallet.address,
                        ownerAddress: completedWallet.owner_address,
                        name: 'Dashboard name',
                        source: 'Dashboard source',
                    },
                },
            }),
        );
        registry.validateAgenticWallet.mockResolvedValue({
            address: completedWallet.address,
            ownerAddress: completedWallet.owner_address,
            collectionAddress: completedWallet.collection_address,
            operatorPublicKey: completedWallet.operator_public_key,
            deployedByUser: true,
        });
        registry.completePendingAgenticSetup.mockResolvedValue(completedWallet);

        const result = await service.completeRootWalletSetup({
            setupId: pendingDeployment.id,
        });

        expect(registry.completePendingAgenticSetup).toHaveBeenCalledWith({
            setupId: pendingDeployment.id,
            validatedWallet: expect.objectContaining({
                address: completedWallet.address,
            }),
            name: 'Dashboard name',
            source: 'Dashboard source',
        });
        expect(result.usedCallbackPayload).toBe(true);
    });

    it('rejects callback completion when callback network does not match the pending network', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(
            createSession({
                status: 'callback_received',
                payload: {
                    event: 'agent_wallet_deployed',
                    network: { chainId: '-3' },
                    wallet: {
                        address: completedWallet.address,
                    },
                },
            }),
        );

        await expect(
            service.completeRootWalletSetup({
                setupId: pendingDeployment.id,
            }),
        ).rejects.toThrow(/callback network does not match/i);
    });

    it('rejects callback completion when callback operator public key does not match the pending setup', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(
            createSession({
                status: 'callback_received',
                payload: {
                    event: 'agent_wallet_deployed',
                    network: { chainId: '-239' },
                    wallet: {
                        address: completedWallet.address,
                        operatorPublicKey: '0xdead',
                    },
                },
            }),
        );

        await expect(
            service.completeRootWalletSetup({
                setupId: pendingDeployment.id,
            }),
        ).rejects.toThrow(/callback operator public key does not match/i);
    });

    it('rejects completion when the validated root wallet was not deployed by the user', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(createSession({ status: 'pending' }));
        registry.validateAgenticWallet.mockResolvedValue({
            address: completedWallet.address,
            ownerAddress: completedWallet.owner_address,
            collectionAddress: completedWallet.collection_address,
            operatorPublicKey: completedWallet.operator_public_key,
            deployedByUser: false,
        });

        await expect(
            service.completeRootWalletSetup({
                setupId: pendingDeployment.id,
                walletAddress: completedWallet.address,
            }),
        ).rejects.toThrow(/must be deployed by the user/i);
        expect(registry.completePendingAgenticSetup).not.toHaveBeenCalled();
    });

    it('fails fast with a clearer message when a manual wallet address is not an agentic wallet contract', async () => {
        const { registry, sessionManager, service } = createDeps();
        registry.getPendingAgenticSetup.mockResolvedValue(pendingDeployment);
        sessionManager.getSession.mockReturnValue(createSession({ status: 'pending' }));
        registry.validateAgenticWallet.mockRejectedValue(
            new AgenticWalletValidationError(
                'wrong_contract_type',
                `Address ${completedWallet.address} is not an agentic wallet contract.`,
            ),
        );

        await expect(
            service.completeRootWalletSetup({
                setupId: pendingDeployment.id,
                walletAddress: completedWallet.address,
            }),
        ).rejects.toThrow(/manual wallet address failed agentic wallet preflight/i);
        expect(registry.completePendingAgenticSetup).not.toHaveBeenCalled();
    });

    it('cancels setup by clearing persisted state and callback session', async () => {
        const { registry, sessionManager, service } = createDeps();

        await service.cancelRootWalletSetup(pendingDeployment.id);

        expect(registry.removePendingAgenticSetup).toHaveBeenCalledWith({ id: pendingDeployment.id });
        expect(sessionManager.cancelSession).toHaveBeenCalledWith(pendingDeployment.id);
    });
});
