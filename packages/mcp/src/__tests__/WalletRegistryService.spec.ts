/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createMcpWalletServiceFromStoredWallet: vi.fn(),
    createApiClient: vi.fn(),
    validateAgenticWalletAddress: vi.fn(),
    listAgenticWalletsByOwner: vi.fn(),
    resolveOperatorCredentials: vi.fn(),
    generateOperatorKeyPair: vi.fn(),
    buildAgenticDashboardLink: vi.fn((address: string) => `https://dashboard.test/agent/${address}`),
    buildAgenticChangeKeyDeepLink: vi.fn(
        (address: string, publicKey: string) =>
            `https://dashboard.test/agent/${address}?action=change-public-key&nextOperatorPublicKey=${publicKey}`,
    ),
}));

vi.mock('../runtime/wallet-runtime.js', () => ({
    createMcpWalletServiceFromStoredWallet: mocks.createMcpWalletServiceFromStoredWallet,
}));

vi.mock('../utils/ton-client.js', () => ({
    createApiClient: mocks.createApiClient,
}));

vi.mock('../utils/agentic.js', () => ({
    validateAgenticWalletAddress: mocks.validateAgenticWalletAddress,
    listAgenticWalletsByOwner: mocks.listAgenticWalletsByOwner,
    resolveOperatorCredentials: mocks.resolveOperatorCredentials,
    generateOperatorKeyPair: mocks.generateOperatorKeyPair,
    buildAgenticDashboardLink: mocks.buildAgenticDashboardLink,
    buildAgenticChangeKeyDeepLink: mocks.buildAgenticChangeKeyDeepLink,
}));

import {
    DEFAULT_AGENTIC_COLLECTION_ADDRESS,
    createAgenticWalletRecord,
    createEmptyConfig,
    createPendingAgenticDeployment,
    createStandardWalletRecord,
    loadConfigWithMigration,
    saveConfig,
} from '../registry/config.js';
import { WalletRegistryService } from '../services/WalletRegistryService.js';

describe('WalletRegistryService', () => {
    const mainAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const agentAddress = 'EQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53kAk';
    const ownerAddress = DEFAULT_AGENTIC_COLLECTION_ADDRESS;
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-wallet-registry-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
        delete process.env.TONCENTER_API_KEY;

        mocks.createMcpWalletServiceFromStoredWallet.mockReset();
        mocks.createApiClient.mockReset();
        mocks.validateAgenticWalletAddress.mockReset();
        mocks.listAgenticWalletsByOwner.mockReset();
        mocks.resolveOperatorCredentials.mockReset();
        mocks.generateOperatorKeyPair.mockReset();
        mocks.buildAgenticDashboardLink.mockClear();
        mocks.buildAgenticChangeKeyDeepLink.mockClear();
        mocks.createApiClient.mockReturnValue({ kind: 'api-client' });
        mocks.validateAgenticWalletAddress.mockResolvedValue({
            address: agentAddress,
            balanceNano: '0',
            balanceTon: '0.0000',
            ownerAddress,
            operatorPublicKey: '0xabc',
            originOperatorPublicKey: '0xabc',
            collectionAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
            nftItemIndex: '1',
            deployedByUser: true,
            name: 'Agent',
        });
        mocks.resolveOperatorCredentials.mockImplementation(async (privateKey: string, expectedPublicKey?: string) => ({
            privateKey: `normalized:${privateKey}`,
            publicKey: expectedPublicKey ?? '0xresolved',
        }));
        mocks.generateOperatorKeyPair.mockResolvedValue({
            privateKey: '0xgenerated-private',
            publicKey: '0xgenerated-public',
        });
    });

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('persists per-network config updates', async () => {
        const registry = new WalletRegistryService();

        const updated = await registry.setNetworkConfig('testnet', {
            toncenter_api_key: 'test-key',
            agentic_collection_address: ownerAddress,
        });

        expect(updated.toncenter_api_key).toBe('test-key');
        expect(updated.agentic_collection_address).toBeDefined();
        await expect(registry.getNetworkConfig('testnet')).resolves.toEqual(updated);
    });

    it('uses runtime network overrides in registry mode', async () => {
        const registry = new WalletRegistryService(undefined, {
            mainnet: {
                apiKey: 'override-key',
            },
        });

        await expect(registry.getNetworkConfig('mainnet')).resolves.toEqual({
            toncenter_api_key: 'override-key',
            agentic_collection_address: expect.any(String),
        });
    });

    it('creates a wallet service for the selected wallet and passes the network api key', async () => {
        const standard = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: mainAddress,
            mnemonic: 'abandon '.repeat(23) + 'about',
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: standard.id,
            wallets: [standard],
            networks: {
                mainnet: {
                    toncenter_api_key: 'main-key',
                },
            },
        });

        const close = vi.fn();
        mocks.createMcpWalletServiceFromStoredWallet.mockResolvedValue({
            service: { getAddress: () => standard.address },
            close,
        });

        const registry = new WalletRegistryService();
        const context = await registry.createWalletService();

        expect(context.wallet).toMatchObject({ id: standard.id, address: standard.address });
        expect(context.close).toBe(close);
        expect(mocks.createMcpWalletServiceFromStoredWallet).toHaveBeenCalledWith({
            wallet: expect.objectContaining({ id: standard.id }),
            contacts: undefined,
            toncenterApiKey: 'main-key',
            requiresSigning: undefined,
        });
    });

    it('uses external network overrides when config does not have a toncenter api key', async () => {
        const standard = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: mainAddress,
            mnemonic: 'abandon '.repeat(23) + 'about',
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: standard.id,
            wallets: [standard],
        });

        mocks.createMcpWalletServiceFromStoredWallet.mockResolvedValue({
            service: { getAddress: () => standard.address },
            close: vi.fn(),
        });

        const registry = new WalletRegistryService(undefined, {
            mainnet: { apiKey: 'override-key' },
        });
        const config = await registry.getNetworkConfig('mainnet');
        await registry.createWalletService();

        expect(config.toncenter_api_key).toBe('override-key');
        expect(mocks.createMcpWalletServiceFromStoredWallet).toHaveBeenCalledWith({
            wallet: expect.objectContaining({ id: standard.id }),
            contacts: undefined,
            toncenterApiKey: 'override-key',
            requiresSigning: undefined,
        });
    });

    it('rejects write-mode access for agentic wallets without operator key', async () => {
        const wallet = createAgenticWalletRecord({
            name: 'Read-only agent',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: wallet.id,
            wallets: [wallet],
        });

        const registry = new WalletRegistryService();

        await expect(registry.createWalletService(undefined, { requiresSigning: true })).rejects.toThrow(
            /missing operator_private_key/i,
        );
        expect(mocks.createMcpWalletServiceFromStoredWallet).not.toHaveBeenCalled();
    });

    it('rejects write contexts for agentic wallets without operator key', async () => {
        const wallet = createAgenticWalletRecord({
            name: 'Read-only agent',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: wallet.id,
            wallets: [wallet],
        });

        const registry = new WalletRegistryService();

        await expect(registry.createWalletService(undefined, { requiresSigning: true })).rejects.toThrow(
            /missing operator_private_key/i,
        );
        expect(mocks.createMcpWalletServiceFromStoredWallet).not.toHaveBeenCalled();
    });

    it('validates and imports an agentic wallet while recovering operator key from pending setup', async () => {
        const pending = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPrivateKey: '0xpending',
            operatorPublicKey: '0xbeef',
            name: 'Pending root agent',
            source: 'Started from MCP',
        });
        saveConfig({
            ...createEmptyConfig(),
            pending_agentic_deployments: [pending],
        });
        mocks.validateAgenticWalletAddress.mockResolvedValue({
            address: agentAddress,
            balanceNano: '42',
            balanceTon: '0.000000042',
            ownerAddress,
            operatorPublicKey: '0xbeef',
            originOperatorPublicKey: '0x1234',
            collectionAddress: ownerAddress,
            nftItemIndex: '42',
            deployedByUser: true,
            name: 'On-chain agent',
        });

        const registry = new WalletRegistryService();
        const result = await registry.importAgenticWallet({
            address: agentAddress,
            network: 'mainnet',
        });

        expect(result.recoveredPendingKeyDraft).toBe(true);
        expect(result.updatedExisting).toBe(false);
        expect(result.dashboardUrl).toBe(`https://dashboard.test/agent/${result.wallet.address}`);
        expect(result.wallet).toMatchObject({
            type: 'agentic',
            name: 'Pending root agent',
            operator_private_key: '0xpending',
            operator_public_key: '0xbeef',
            source: 'Started from MCP',
        });

        const stored = await loadConfigWithMigration();
        expect(stored?.active_wallet_id).toBe(result.wallet.id);
        expect(stored?.pending_agentic_deployments).toBeUndefined();
    });

    it('completes a pending root-agent setup and makes the imported wallet active', async () => {
        const pending = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPrivateKey: '0xpending',
            operatorPublicKey: '0xbeef',
            name: 'Pending agent',
            source: 'Pending source',
        });
        saveConfig({
            ...createEmptyConfig(),
            pending_agentic_deployments: [pending],
        });

        const registry = new WalletRegistryService();
        const wallet = await registry.completePendingAgenticSetup({
            setupId: pending.id,
            validatedWallet: {
                address: agentAddress,
                balanceNano: '100',
                balanceTon: '0.0000001',
                ownerAddress,
                operatorPublicKey: '0xbeef',
                originOperatorPublicKey: '0xfeed',
                collectionAddress: ownerAddress,
                nftItemIndex: '17',
                deployedByUser: true,
                name: 'Validated agent',
            },
            name: 'Imported root agent',
            source: 'Completed from callback',
        });

        expect(wallet).toMatchObject({
            type: 'agentic',
            name: 'Imported root agent',
            operator_private_key: '0xpending',
            source: 'Completed from callback',
            deployed_by_user: true,
        });

        const stored = await loadConfigWithMigration();
        expect(stored?.active_wallet_id).toBe(wallet.id);
        expect(stored?.wallets).toEqual([expect.objectContaining({ id: wallet.id })]);
        expect(stored?.pending_agentic_deployments).toBeUndefined();
    });

    it('starts an agentic key rotation and stores only a pending draft until completion', async () => {
        const wallet = createAgenticWalletRecord({
            name: 'Rotatable agent',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
            operatorPrivateKey: '0xold-private',
            operatorPublicKey: '0xold-public',
            collectionAddress: ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: wallet.id,
            wallets: [wallet],
        });

        const registry = new WalletRegistryService();
        const result = await registry.startAgenticKeyRotation({});

        expect(result.wallet.id).toBe(wallet.id);
        expect(result.updatedExisting).toBe(false);
        expect(result.dashboardUrl).toContain('action=change-public-key');
        expect(result.pendingRotation).toMatchObject({
            wallet_id: wallet.id,
            operator_private_key: '0xgenerated-private',
            operator_public_key: '0xgenerated-public',
        });

        const stored = await loadConfigWithMigration();
        expect(stored?.wallets[0]).toMatchObject({
            id: wallet.id,
            operator_private_key: '0xold-private',
            operator_public_key: '0xold-public',
        });
        expect(stored?.pending_agentic_key_rotations).toEqual([
            expect.objectContaining({
                id: result.pendingRotation.id,
                wallet_id: wallet.id,
                operator_private_key: '0xgenerated-private',
                operator_public_key: '0xgenerated-public',
            }),
        ]);
    });

    it('completes an agentic key rotation after the on-chain operator public key changes', async () => {
        const wallet = createAgenticWalletRecord({
            name: 'Rotatable agent',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
            operatorPrivateKey: '0xold-private',
            operatorPublicKey: '0xold-public',
            collectionAddress: ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: wallet.id,
            wallets: [wallet],
        });

        const registry = new WalletRegistryService();
        const started = await registry.startAgenticKeyRotation({
            walletSelector: wallet.id,
        });
        mocks.validateAgenticWalletAddress.mockResolvedValue({
            address: agentAddress,
            balanceNano: '42',
            balanceTon: '0.000000042',
            ownerAddress,
            operatorPublicKey: '0xgenerated-public',
            originOperatorPublicKey: '0x1234',
            collectionAddress: ownerAddress,
            nftItemIndex: '42',
            deployedByUser: true,
            name: 'On-chain agent',
        });

        const completed = await registry.completeAgenticKeyRotation(started.pendingRotation.id);

        expect(completed.wallet).toMatchObject({
            id: wallet.id,
            operator_private_key: '0xgenerated-private',
            operator_public_key: '0xgenerated-public',
        });
        expect(completed.dashboardUrl).toBe(`https://dashboard.test/agent/${wallet.address}`);
        const config = await loadConfigWithMigration();
        expect(config?.pending_agentic_key_rotations).toBeUndefined();
    });

    it('rejects agentic key rotation completion when the on-chain operator public key does not match', async () => {
        const wallet = createAgenticWalletRecord({
            name: 'Rotatable agent',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
            operatorPrivateKey: '0xold-private',
            operatorPublicKey: '0xold-public',
            collectionAddress: ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: wallet.id,
            wallets: [wallet],
        });

        const registry = new WalletRegistryService();
        const started = await registry.startAgenticKeyRotation({
            walletSelector: wallet.id,
            operatorPrivateKey: '0xmanual-private',
        });
        mocks.validateAgenticWalletAddress.mockResolvedValue({
            address: agentAddress,
            balanceNano: '42',
            balanceTon: '0.000000042',
            ownerAddress,
            operatorPublicKey: '0xunexpected',
            originOperatorPublicKey: '0x1234',
            collectionAddress: ownerAddress,
            nftItemIndex: '42',
            deployedByUser: true,
        });

        await expect(registry.completeAgenticKeyRotation(started.pendingRotation.id)).rejects.toThrow(
            /does not match pending rotation/i,
        );
        const config = await loadConfigWithMigration();
        expect(config?.pending_agentic_key_rotations).toHaveLength(1);
    });

    it('rejects pending root-agent completion when operator public key does not match the pending setup', async () => {
        const pending = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPrivateKey: '0xpending',
            operatorPublicKey: '0xbeef',
            name: 'Pending agent',
        });
        saveConfig({
            ...createEmptyConfig(),
            pending_agentic_deployments: [pending],
        });

        const registry = new WalletRegistryService();

        await expect(
            registry.completePendingAgenticSetup({
                setupId: pending.id,
                validatedWallet: {
                    address: agentAddress,
                    balanceNano: '100',
                    balanceTon: '0.0000001',
                    ownerAddress,
                    operatorPublicKey: '0xdead',
                    collectionAddress: ownerAddress,
                    nftItemIndex: '1',
                    deployedByUser: true,
                },
            }),
        ).rejects.toThrow(/pending operator key does not match/i);
    });

    it('rejects completion when the validated wallet operator key does not match the pending setup', async () => {
        const pending = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPrivateKey: '0xpending',
            operatorPublicKey: '0xbeef',
        });
        saveConfig({
            ...createEmptyConfig(),
            pending_agentic_deployments: [pending],
        });

        const registry = new WalletRegistryService();

        await expect(
            registry.completePendingAgenticSetup({
                setupId: pending.id,
                validatedWallet: {
                    address: agentAddress,
                    balanceNano: '100',
                    balanceTon: '0.0000001',
                    ownerAddress,
                    operatorPublicKey: '0xdead',
                    originOperatorPublicKey: '0xfeed',
                    collectionAddress: ownerAddress,
                    nftItemIndex: '1',
                    deployedByUser: true,
                },
            }),
        ).rejects.toThrow(/pending operator key does not match/i);
    });

    it('routes validation and owner lookup through the agentic client helpers', async () => {
        const expectedWallets = [
            {
                address: agentAddress,
                balanceNano: '1000',
                balanceTon: '0.000001',
                ownerAddress,
                operatorPublicKey: '0xbeef',
                collectionAddress: ownerAddress,
            },
        ];
        mocks.validateAgenticWalletAddress.mockResolvedValue(expectedWallets[0]);
        mocks.listAgenticWalletsByOwner.mockResolvedValue(expectedWallets);

        const registry = new WalletRegistryService();
        const validated = await registry.validateAgenticWallet({ address: agentAddress, network: 'testnet' });
        const listed = await registry.listAgenticWalletsByOwner({ ownerAddress, network: 'mainnet' });

        expect(validated.address).toBe(agentAddress);
        expect(listed).toEqual(expectedWallets);
        expect(mocks.createApiClient).toHaveBeenNthCalledWith(1, 'testnet', undefined);
        expect(mocks.createApiClient).toHaveBeenNthCalledWith(2, 'mainnet', undefined);
    });

    it('soft-deletes wallets and rotates the active wallet to the next visible one', async () => {
        const first = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: mainAddress,
        });
        const second = createAgenticWalletRecord({
            name: 'Agent wallet',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: first.id,
            wallets: [first, second],
        });

        const registry = new WalletRegistryService();
        const result = await registry.removeWallet(first.id);

        expect(result.removedWalletId).toBe(first.id);
        expect(result.activeWalletId).toBe(second.id);
        const config = await loadConfigWithMigration();
        expect(config?.wallets).toEqual([
            expect.objectContaining({ id: first.id, removed: true }),
            expect.objectContaining({ id: second.id }),
        ]);
        await expect(registry.listWallets()).resolves.toEqual([expect.objectContaining({ id: second.id })]);
    });
});
