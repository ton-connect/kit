/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IContactResolver } from '../types/contacts.js';
import type { NetworkConfig as RuntimeNetworkConfig } from './McpWalletService.js';
import {
    ConfigError,
    createAgenticWalletRecord,
    createEmptyConfig,
    createPendingAgenticDeployment,
    createPendingAgenticKeyRotation,
    findPendingAgenticDeployment,
    findPendingAgenticKeyRotation,
    findWallet,
    findWalletByAddress,
    getActiveWallet,
    getAgenticCollectionAddress,
    listPendingAgenticDeployments,
    listPendingAgenticKeyRotations,
    listWallets,
    loadConfigWithMigration,
    normalizeNetwork,
    removePendingAgenticDeployment,
    removePendingAgenticKeyRotation,
    removeWallet,
    saveConfig,
    setActiveWallet,
    upsertPendingAgenticDeployment,
    upsertPendingAgenticKeyRotation,
    updateNetworkConfig,
    upsertWallet,
} from '../registry/config.js';
import type {
    ConfigNetwork,
    PendingAgenticDeployment,
    PendingAgenticKeyRotation,
    StoredAgenticWallet,
    StoredWallet,
    TonConfig,
    TonNetwork,
} from '../registry/config.js';
import { createMcpWalletServiceFromStoredWallet } from '../runtime/wallet-runtime.js';
import type { WalletServiceContext } from '../runtime/wallet-runtime.js';
import {
    buildAgenticChangeKeyDeepLink,
    buildAgenticDashboardLink,
    generateOperatorKeyPair,
    listAgenticWalletsByOwner,
    resolveOperatorCredentials,
    validateAgenticWalletAddress,
} from '../utils/agentic.js';
import type { AgenticImportCandidate } from '../utils/agentic.js';
import { createApiClient } from '../utils/ton-client.js';

function defaultWalletName(prefix: string, address: string): string {
    return `${prefix} ${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface StartAgenticKeyRotationResult {
    wallet: StoredAgenticWallet;
    pendingRotation: PendingAgenticKeyRotation;
    dashboardUrl: string;
    updatedExisting: boolean;
}

export interface CompleteAgenticKeyRotationResult {
    wallet: StoredAgenticWallet;
    pendingRotation: PendingAgenticKeyRotation;
    dashboardUrl: string;
}

export class WalletRegistryService {
    constructor(
        private readonly contacts?: IContactResolver,
        private readonly networkOverrides?: {
            mainnet?: RuntimeNetworkConfig;
            testnet?: RuntimeNetworkConfig;
        },
    ) {}

    private resolveToncenterApiKey(config: TonConfig | null, network: TonNetwork): string | undefined {
        const envKey = process.env.TONCENTER_API_KEY?.trim();
        if (envKey) {
            return envKey;
        }

        const overrideKey = this.networkOverrides?.[network]?.apiKey?.trim();
        if (overrideKey) {
            return overrideKey;
        }

        return config?.networks[network]?.toncenter_api_key?.trim() || undefined;
    }

    private assertWalletSupportsSigning(wallet: StoredWallet): void {
        if (wallet.type === 'standard') {
            if (!wallet.mnemonic && !wallet.private_key) {
                throw new ConfigError(
                    `Wallet "${wallet.name}" is missing signing credentials. Re-import it with mnemonic or private key before using write tools.`,
                );
            }
            return;
        }

        if (!wallet.operator_private_key) {
            throw new ConfigError(
                `Wallet "${wallet.name}" is missing operator_private_key. Rotate the operator key with agentic_rotate_operator_key before using write tools.`,
            );
        }
    }

    async loadConfig(): Promise<TonConfig> {
        return (await loadConfigWithMigration()) ?? createEmptyConfig();
    }

    async listWallets(): Promise<StoredWallet[]> {
        return listWallets(await this.loadConfig());
    }

    async getCurrentWallet(): Promise<StoredWallet | null> {
        return getActiveWallet(await this.loadConfig());
    }

    async requireCurrentWallet(): Promise<StoredWallet> {
        const wallet = await this.getCurrentWallet();
        if (!wallet) {
            throw new ConfigError('No active wallet configured. Import a wallet first or set one active.');
        }
        return wallet;
    }

    async getNetworkConfig(network: TonNetwork): Promise<ConfigNetwork> {
        const config = await this.loadConfig();
        return {
            toncenter_api_key: this.resolveToncenterApiKey(config, network),
            agentic_collection_address: getAgenticCollectionAddress(config, network),
        };
    }

    async setNetworkConfig(network: TonNetwork, patch: Partial<ConfigNetwork>): Promise<ConfigNetwork> {
        const config = await this.loadConfig();
        const nextConfig = updateNetworkConfig(config, network, patch);
        saveConfig(nextConfig);
        return {
            toncenter_api_key: this.resolveToncenterApiKey(nextConfig, network),
            agentic_collection_address: getAgenticCollectionAddress(nextConfig, network),
        };
    }

    async setActiveWallet(selector: string): Promise<StoredWallet> {
        const config = await this.loadConfig();
        const result = setActiveWallet(config, selector);
        if (!result.wallet) {
            throw new ConfigError(`Wallet "${selector}" was not found.`);
        }
        saveConfig(result.config);
        return result.wallet;
    }

    async removeWallet(selector: string): Promise<{ removedWalletId: string; activeWalletId: string | null }> {
        const config = await this.loadConfig();
        const result = removeWallet(config, selector);
        if (!result.removed) {
            throw new ConfigError(`Wallet "${selector}" was not found.`);
        }
        saveConfig(result.config);
        return { removedWalletId: result.removed.id, activeWalletId: result.config.active_wallet_id };
    }

    async createWalletService(
        walletSelector?: string,
        options?: { requiresSigning?: boolean },
    ): Promise<WalletServiceContext & { wallet: StoredWallet }> {
        const config = await this.loadConfig();
        const wallet = walletSelector ? findWallet(config, walletSelector) : getActiveWallet(config);
        if (!wallet) {
            throw new ConfigError(
                walletSelector
                    ? `Wallet "${walletSelector}" was not found.`
                    : 'No active wallet configured. Import a wallet first or set one active.',
            );
        }
        if (options?.requiresSigning) {
            this.assertWalletSupportsSigning(wallet);
        }
        const toncenterApiKey = this.resolveToncenterApiKey(config, wallet.network);
        const context = await createMcpWalletServiceFromStoredWallet({
            wallet,
            contacts: this.contacts,
            toncenterApiKey,
            requiresSigning: options?.requiresSigning,
        });
        return { ...context, wallet };
    }

    async validateAgenticWallet(input: {
        address: string;
        network?: string;
        collectionAddress?: string;
        ownerAddress?: string;
    }): Promise<AgenticImportCandidate> {
        const config = await this.loadConfig();
        const network = normalizeNetwork(input.network, 'mainnet');
        const client = createApiClient(network, this.resolveToncenterApiKey(config, network));
        return validateAgenticWalletAddress({
            client,
            address: input.address,
            collectionAddress: input.collectionAddress || getAgenticCollectionAddress(config, network),
            ownerAddress: input.ownerAddress,
            network,
        });
    }

    async listAgenticWalletsByOwner(input: {
        ownerAddress: string;
        network?: string;
    }): Promise<AgenticImportCandidate[]> {
        const config = await this.loadConfig();
        const network = normalizeNetwork(input.network, 'mainnet');
        const client = createApiClient(network, this.resolveToncenterApiKey(config, network));
        const collectionAddress = getAgenticCollectionAddress(config, network);
        if (!collectionAddress) {
            throw new ConfigError(`Missing agentic collection address for ${network}.`);
        }

        return listAgenticWalletsByOwner({
            client,
            ownerAddress: input.ownerAddress,
            collectionAddress,
            network,
        });
    }

    async importAgenticWallet(input: { address: string; network?: string; name?: string }): Promise<{
        wallet: StoredAgenticWallet;
        recoveredPendingKeyDraft: boolean;
        updatedExisting: boolean;
        dashboardUrl: string;
    }> {
        const config = await this.loadConfig();
        const network = normalizeNetwork(input.network, 'mainnet');
        const client = createApiClient(network, this.resolveToncenterApiKey(config, network));
        const validated = await validateAgenticWalletAddress({
            client,
            address: input.address.trim(),
            collectionAddress: getAgenticCollectionAddress(config, network),
            network,
        });

        const existingWallet = findWalletByAddress(config, network, validated.address);
        if (existingWallet && existingWallet.type !== 'agentic') {
            throw new ConfigError(
                `Wallet address ${existingWallet.address} is already configured as "${existingWallet.name}" (${existingWallet.id}) on ${network}.`,
            );
        }

        const validatedOperatorPublicKey = validated.operatorPublicKey;
        let operatorPrivateKey: string | undefined;
        let operatorPublicKey = validatedOperatorPublicKey;
        const matchedPendingDeployment = validatedOperatorPublicKey
            ? findPendingAgenticDeployment(config, {
                  network,
                  operatorPublicKey: validatedOperatorPublicKey,
              })
            : null;

        if (matchedPendingDeployment) {
            operatorPrivateKey = matchedPendingDeployment.operator_private_key;
        } else if (existingWallet?.type === 'agentic' && existingWallet.operator_private_key) {
            operatorPrivateKey = existingWallet.operator_private_key;
        }

        if (operatorPrivateKey && validatedOperatorPublicKey) {
            operatorPublicKey = (await resolveOperatorCredentials(operatorPrivateKey, validatedOperatorPublicKey))
                .publicKey;
        }

        const record = createAgenticWalletRecord({
            name:
                input.name?.trim() ||
                matchedPendingDeployment?.name?.trim() ||
                (existingWallet?.type === 'agentic' ? existingWallet.name : undefined) ||
                validated.name ||
                defaultWalletName('Agent', validated.address),
            network,
            address: validated.address,
            ownerAddress: validated.ownerAddress,
            operatorPrivateKey,
            operatorPublicKey,
            source: matchedPendingDeployment?.source || 'Manual import',
            collectionAddress: validated.collectionAddress,
            originOperatorPublicKey: validated.originOperatorPublicKey,
            deployedByUser: validated.deployedByUser,
        });

        const walletToSave =
            existingWallet?.type === 'agentic'
                ? {
                      ...existingWallet,
                      ...record,
                      id: existingWallet.id,
                      created_at: existingWallet.created_at,
                      updated_at: existingWallet.updated_at,
                  }
                : record;

        const nextConfig = removePendingAgenticDeployment(upsertWallet(config, walletToSave, { setActive: true }), {
            network,
            operatorPublicKey: validatedOperatorPublicKey,
        });
        saveConfig(nextConfig);

        return {
            wallet: walletToSave,
            recoveredPendingKeyDraft: Boolean(matchedPendingDeployment),
            updatedExisting: Boolean(existingWallet),
            dashboardUrl: buildAgenticDashboardLink(walletToSave.address),
        };
    }

    async startAgenticKeyRotation(input: {
        walletSelector?: string;
        operatorPrivateKey?: string;
    }): Promise<StartAgenticKeyRotationResult> {
        const config = await this.loadConfig();
        const wallet = input.walletSelector ? findWallet(config, input.walletSelector) : getActiveWallet(config);
        if (!wallet) {
            throw new ConfigError(
                input.walletSelector
                    ? `Wallet "${input.walletSelector}" was not found.`
                    : 'No active wallet configured. Import a wallet first or set one active.',
            );
        }
        if (wallet.type !== 'agentic') {
            throw new ConfigError(`Wallet "${wallet.name}" is not an agentic wallet.`);
        }

        const operatorCredentials = input.operatorPrivateKey
            ? await resolveOperatorCredentials(input.operatorPrivateKey)
            : await generateOperatorKeyPair();
        const pendingRotation = createPendingAgenticKeyRotation({
            walletId: wallet.id,
            network: wallet.network,
            walletAddress: wallet.address,
            ownerAddress: wallet.owner_address,
            collectionAddress: wallet.collection_address,
            operatorPrivateKey: operatorCredentials.privateKey,
            operatorPublicKey: operatorCredentials.publicKey,
            idPrefix: wallet.name,
        });

        const updatedExisting = Boolean(findPendingAgenticKeyRotation(config, { walletId: wallet.id }));
        const nextConfig = upsertPendingAgenticKeyRotation(
            removePendingAgenticKeyRotation(config, { walletId: wallet.id }),
            pendingRotation,
        );
        saveConfig(nextConfig);

        return {
            wallet,
            pendingRotation,
            dashboardUrl: buildAgenticChangeKeyDeepLink(wallet.address, operatorCredentials.publicKey),
            updatedExisting,
        };
    }

    async listPendingAgenticKeyRotations(): Promise<PendingAgenticKeyRotation[]> {
        return listPendingAgenticKeyRotations(await this.loadConfig());
    }

    async getPendingAgenticKeyRotation(rotationId: string): Promise<PendingAgenticKeyRotation | null> {
        return findPendingAgenticKeyRotation(await this.loadConfig(), { id: rotationId });
    }

    async completeAgenticKeyRotation(rotationId: string): Promise<CompleteAgenticKeyRotationResult> {
        const config = await this.loadConfig();
        const pendingRotation = findPendingAgenticKeyRotation(config, { id: rotationId });
        if (!pendingRotation) {
            throw new ConfigError(`Pending agentic key rotation "${rotationId}" was not found.`);
        }

        const wallet = findWallet(config, pendingRotation.wallet_id);
        if (!wallet) {
            throw new ConfigError(`Wallet "${pendingRotation.wallet_id}" was not found for the pending key rotation.`);
        }
        if (wallet.type !== 'agentic') {
            throw new ConfigError(`Wallet "${wallet.name}" is not an agentic wallet.`);
        }

        const validated = await this.validateAgenticWallet({
            address: pendingRotation.wallet_address,
            network: pendingRotation.network,
            collectionAddress: pendingRotation.collection_address,
            ownerAddress: pendingRotation.owner_address,
        });
        if (!validated.operatorPublicKey) {
            throw new ConfigError(`Agentic wallet "${wallet.name}" is missing an on-chain operator public key.`);
        }
        if (
            validated.operatorPublicKey.trim().toLowerCase() !==
            pendingRotation.operator_public_key.trim().toLowerCase()
        ) {
            throw new ConfigError(
                `On-chain operator public key for "${wallet.name}" does not match pending rotation ${rotationId}.`,
            );
        }

        const updatedWallet: StoredAgenticWallet = {
            ...wallet,
            operator_private_key: pendingRotation.operator_private_key,
            operator_public_key: pendingRotation.operator_public_key,
        };
        const nextConfig = removePendingAgenticKeyRotation(
            upsertWallet(config, updatedWallet, { setActive: wallet.id === config.active_wallet_id }),
            { id: pendingRotation.id },
        );
        saveConfig(nextConfig);

        return {
            wallet: updatedWallet,
            pendingRotation,
            dashboardUrl: buildAgenticDashboardLink(wallet.address),
        };
    }

    async cancelAgenticKeyRotation(rotationId: string): Promise<void> {
        const config = await this.loadConfig();
        saveConfig(removePendingAgenticKeyRotation(config, { id: rotationId }));
    }

    async listPendingAgenticSetups(): Promise<PendingAgenticDeployment[]> {
        return listPendingAgenticDeployments(await this.loadConfig());
    }

    async getPendingAgenticSetup(setupId: string): Promise<PendingAgenticDeployment | null> {
        return findPendingAgenticDeployment(await this.loadConfig(), { id: setupId });
    }

    async createPendingAgenticSetup(input: {
        network: TonNetwork;
        operatorPrivateKey: string;
        operatorPublicKey: string;
        name?: string;
        source?: string;
        collectionAddress?: string;
    }): Promise<PendingAgenticDeployment> {
        const config = await this.loadConfig();
        const deployment = createPendingAgenticDeployment(input);
        saveConfig(upsertPendingAgenticDeployment(config, deployment));
        return deployment;
    }

    async removePendingAgenticSetup(input: {
        id?: string;
        network?: TonNetwork;
        operatorPublicKey?: string;
    }): Promise<void> {
        const config = await this.loadConfig();
        saveConfig(removePendingAgenticDeployment(config, input));
    }

    async completePendingAgenticSetup(input: {
        setupId: string;
        validatedWallet: AgenticImportCandidate;
        name?: string;
        source?: string;
    }): Promise<StoredAgenticWallet> {
        const config = await this.loadConfig();
        const pending = findPendingAgenticDeployment(config, { id: input.setupId });
        if (!pending) {
            throw new ConfigError(`Pending agentic setup "${input.setupId}" was not found.`);
        }

        if (!input.validatedWallet.deployedByUser) {
            throw new ConfigError('The first agentic root wallet must be deployed by the user.');
        }
        if (!input.validatedWallet.operatorPublicKey) {
            throw new ConfigError('Validated agentic wallet is missing operator public key.');
        }
        if (
            pending.operator_public_key.trim().toLowerCase() !==
            input.validatedWallet.operatorPublicKey.trim().toLowerCase()
        ) {
            throw new ConfigError('Pending operator key does not match the target agentic wallet.');
        }

        const existingWallet = findWalletByAddress(config, pending.network, input.validatedWallet.address);
        if (existingWallet && existingWallet.type !== 'agentic') {
            throw new ConfigError(
                `Wallet address ${existingWallet.address} is already configured as "${existingWallet.name}" (${existingWallet.id}) on ${pending.network}.`,
            );
        }

        const record = createAgenticWalletRecord({
            name:
                input.name?.trim() ||
                pending.name?.trim() ||
                input.validatedWallet.name ||
                defaultWalletName('Agent', input.validatedWallet.address),
            network: pending.network,
            address: input.validatedWallet.address,
            ownerAddress: input.validatedWallet.ownerAddress,
            operatorPrivateKey: pending.operator_private_key,
            operatorPublicKey: pending.operator_public_key || input.validatedWallet.operatorPublicKey,
            source: input.source?.trim() || pending.source?.trim() || 'Deployed via @ton/mcp',
            collectionAddress: input.validatedWallet.collectionAddress || pending.collection_address,
            originOperatorPublicKey: input.validatedWallet.originOperatorPublicKey,
            deployedByUser: input.validatedWallet.deployedByUser,
        });

        const walletToSave =
            existingWallet?.type === 'agentic'
                ? {
                      ...existingWallet,
                      ...record,
                      id: existingWallet.id,
                      created_at: existingWallet.created_at,
                      updated_at: existingWallet.updated_at,
                  }
                : record;

        const nextConfig = removePendingAgenticDeployment(upsertWallet(config, walletToSave, { setActive: true }), {
            id: pending.id,
        });
        saveConfig(nextConfig);
        return walletToSave;
    }
}
