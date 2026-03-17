/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { normalizeNetwork } from '../registry/config.js';
import type { PendingAgenticDeployment, StoredAgenticWallet, TonNetwork } from '../registry/config.js';
import { AgenticWalletValidationError, buildAgenticCreateDeepLink, generateOperatorKeyPair } from '../utils/agentic.js';
import type { WalletRegistryService } from './WalletRegistryService.js';
import type { AgenticSetupSessionManager } from './AgenticSetupSessionManager.js';
import type { AgenticDeployCallbackPayload, AgenticSetupSession } from './AgenticSetupSessionManager.js';

function getDefaultAgenticSource(source?: string): string {
    const trimmed = source?.trim();
    return trimmed || 'Deployed via @ton/mcp';
}

function getDefaultAgenticName(name: string | undefined, operatorPublicKey: string): string {
    const trimmed = name?.trim();
    return trimmed || `Agent ${operatorPublicKey.replace(/^0x/i, '').slice(0, 6)}`;
}

function payloadMatchesNetwork(payload: AgenticDeployCallbackPayload, network: TonNetwork): boolean {
    const chainId = String(payload.network?.chainId ?? '');
    return network === 'mainnet'
        ? chainId === '-239' || chainId === 'mainnet'
        : chainId === '-3' || chainId === 'testnet';
}

export interface AgenticRootWalletSetupStatus {
    setupId: string;
    pendingDeployment: PendingAgenticDeployment;
    session: AgenticSetupSession | null;
    status: AgenticSetupSession['status'] | 'pending_without_callback';
    dashboardUrl?: string;
}

export class AgenticOnboardingService {
    constructor(
        private readonly registry: WalletRegistryService,
        private readonly sessionManager: AgenticSetupSessionManager,
    ) {}

    async startRootWalletSetup(input: {
        network?: string;
        name?: string;
        source?: string;
        collectionAddress?: string;
        tonDeposit?: string;
    }): Promise<{
        setupId: string;
        network: TonNetwork;
        operatorPublicKey: string;
        dashboardUrl: string;
        callbackUrl: string;
        pendingDeployment: PendingAgenticDeployment;
    }> {
        const network = normalizeNetwork(input.network, 'mainnet');
        const operator = await generateOperatorKeyPair();
        const resolvedName = getDefaultAgenticName(input.name, operator.publicKey);
        const resolvedSource = getDefaultAgenticSource(input.source);
        const pendingDeployment = await this.registry.createPendingAgenticSetup({
            network,
            operatorPrivateKey: operator.privateKey,
            operatorPublicKey: operator.publicKey,
            name: resolvedName,
            source: resolvedSource,
            collectionAddress: input.collectionAddress,
        });

        const session = await this.sessionManager.createSession(pendingDeployment.id);
        const dashboardUrl = buildAgenticCreateDeepLink({
            operatorPublicKey: operator.publicKey,
            callbackUrl: session.callbackUrl,
            agentName: resolvedName,
            source: resolvedSource,
            tonDeposit: input.tonDeposit,
        });

        return {
            setupId: pendingDeployment.id,
            network,
            operatorPublicKey: operator.publicKey,
            dashboardUrl,
            callbackUrl: session.callbackUrl,
            pendingDeployment,
        };
    }

    async listRootWalletSetups(): Promise<AgenticRootWalletSetupStatus[]> {
        const pending = await this.registry.listPendingAgenticSetups();
        return pending.map((deployment) => this.composeStatus(deployment));
    }

    async getRootWalletSetup(setupId: string): Promise<AgenticRootWalletSetupStatus | null> {
        const pending = await this.registry.getPendingAgenticSetup(setupId);
        if (!pending) {
            return null;
        }
        return this.composeStatus(pending);
    }

    private composeStatus(pendingDeployment: PendingAgenticDeployment): AgenticRootWalletSetupStatus {
        const session = this.sessionManager.getSession(pendingDeployment.id);
        return {
            setupId: pendingDeployment.id,
            pendingDeployment,
            session,
            status: session?.status ?? 'pending_without_callback',
        };
    }

    async completeRootWalletSetup(input: { setupId: string; walletAddress?: string; ownerAddress?: string }): Promise<{
        wallet: StoredAgenticWallet;
        resolvedWalletAddress: string;
        usedCallbackPayload: boolean;
    }> {
        const pending = await this.registry.getPendingAgenticSetup(input.setupId);
        if (!pending) {
            throw new Error(`Pending agentic setup "${input.setupId}" was not found.`);
        }

        const session = this.sessionManager.getSession(input.setupId);
        const payload = session?.payload;
        if (payload && !payloadMatchesNetwork(payload, pending.network)) {
            throw new Error(`Callback network does not match ${pending.network}.`);
        }
        const callbackOperatorPublicKey = payload?.wallet?.operatorPublicKey?.trim();
        if (
            callbackOperatorPublicKey &&
            callbackOperatorPublicKey.toLowerCase() !== pending.operator_public_key.trim().toLowerCase()
        ) {
            throw new Error('Callback operator public key does not match the pending setup.');
        }

        const walletAddress = input.walletAddress?.trim() || payload?.wallet?.address?.trim();
        if (!walletAddress) {
            throw new Error('Wallet address is required to complete the agentic root wallet setup.');
        }

        const ownerAddress = input.ownerAddress?.trim() || payload?.wallet?.ownerAddress?.trim();
        let validated;
        try {
            validated = await this.registry.validateAgenticWallet({
                address: walletAddress,
                network: pending.network,
                collectionAddress: pending.collection_address,
                ownerAddress,
            });
        } catch (error) {
            if (input.walletAddress?.trim() && error instanceof AgenticWalletValidationError) {
                throw new Error(
                    `Manual wallet address failed agentic wallet preflight: ${error.message} Re-check the address and try again.`,
                );
            }
            throw error;
        }
        if (!validated.deployedByUser) {
            throw new Error('The first agentic root wallet must be deployed by the user.');
        }

        const wallet = await this.registry.completePendingAgenticSetup({
            setupId: input.setupId,
            validatedWallet: validated,
            name: payload?.wallet?.name,
            source: payload?.wallet?.source,
        });
        this.sessionManager.markCompleted(input.setupId);

        return {
            wallet,
            resolvedWalletAddress: validated.address,
            usedCallbackPayload: Boolean(payload && !input.walletAddress),
        };
    }

    async cancelRootWalletSetup(setupId: string): Promise<void> {
        await this.registry.removePendingAgenticSetup({ id: setupId });
        this.sessionManager.cancelSession(setupId);
    }
}
