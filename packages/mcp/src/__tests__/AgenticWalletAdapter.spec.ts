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
import { Network } from '@ton/walletkit';
import type { ApiClient, Hex, WalletSigner } from '@ton/walletkit';

import { AgenticWalletAdapter } from '../contracts/agentic_wallet/AgenticWalletAdapter.js';
import {
    DEFAULT_AGENTIC_COLLECTION_ADDRESS,
    createAgenticWalletRecord,
    createEmptyConfig,
    loadConfigWithMigration,
    persistAgenticWalletNftIndex,
    saveConfig,
} from '../registry/config.js';

const agentAddress = 'EQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53kAk';
const collectionAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

function createSignerStub(): WalletSigner {
    return {
        publicKey: '00' as Hex,
        async sign() {
            return '00' as Hex;
        },
    } as unknown as WalletSigner;
}

function createClientStub(runGetMethod: ReturnType<typeof vi.fn>): ApiClient {
    return { runGetMethod } as unknown as ApiClient;
}

describe('AgenticWalletAdapter wallet NFT index caching', () => {
    it('does not call the network when the index is provided up-front', async () => {
        const runGetMethod = vi.fn();
        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(runGetMethod),
            network: Network.mainnet(),
            walletNftIndex: 42n,
            collectionAddress,
        });

        const resolved = await adapter.getWalletNftIndex();
        expect(resolved).toBe(42n);
        expect(runGetMethod).not.toHaveBeenCalled();
    });

    it('fetches the index lazily and invokes onWalletNftIndexResolved on first resolve only', async () => {
        const runGetMethod = vi.fn().mockResolvedValue({
            exitCode: 0,
            stack: [{ type: 'num', value: '17' }],
        });
        const onWalletNftIndexResolved = vi.fn();

        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(runGetMethod),
            network: Network.mainnet(),
            walletAddress: agentAddress,
            onWalletNftIndexResolved,
        });

        const firstRead = await adapter.getWalletNftIndex();
        const secondRead = await adapter.getWalletNftIndex();

        expect(firstRead).toBe(17n);
        expect(secondRead).toBe(17n);
        expect(runGetMethod).toHaveBeenCalledTimes(1);
        expect(runGetMethod).toHaveBeenCalledWith(expect.any(String), 'get_subwallet_id');
        expect(onWalletNftIndexResolved).toHaveBeenCalledTimes(1);
        expect(onWalletNftIndexResolved).toHaveBeenCalledWith(17n);
    });

    it('does not invoke the callback when the index is seeded from config', async () => {
        const runGetMethod = vi.fn();
        const onWalletNftIndexResolved = vi.fn();

        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(runGetMethod),
            network: Network.mainnet(),
            walletNftIndex: 3n,
            collectionAddress,
            onWalletNftIndexResolved,
        });

        await adapter.getWalletNftIndex();
        expect(onWalletNftIndexResolved).not.toHaveBeenCalled();
        expect(runGetMethod).not.toHaveBeenCalled();
    });

    it('lazy-builds wallet init from collection address and on-chain index for getStateInit()', async () => {
        const runGetMethod = vi.fn().mockResolvedValue({
            exitCode: 0,
            stack: [{ type: 'num', value: '17' }],
        });

        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(runGetMethod),
            network: Network.mainnet(),
            walletAddress: agentAddress,
            collectionAddress,
        });

        const stateInit = await adapter.getStateInit();
        expect(typeof stateInit).toBe('string');
        expect(stateInit.length).toBeGreaterThan(0);
        expect(runGetMethod).toHaveBeenCalledTimes(1);

        const secondCall = await adapter.getStateInit();
        expect(secondCall).toBe(stateInit);
        expect(runGetMethod).toHaveBeenCalledTimes(1);
    });

    it('throws when getStateInit() is called without a collection address', async () => {
        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(vi.fn()),
            network: Network.mainnet(),
            walletAddress: agentAddress,
        });

        await expect(adapter.getStateInit()).rejects.toThrow(/Agentic wallet init is not configured/i);
    });
});

describe('AgenticWalletAdapter back-fills persisted config via callback', () => {
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-adapter-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
    });

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('persists the resolved index to storage the first time it is fetched', async () => {
        const record = createAgenticWalletRecord({
            name: 'Agent wallet',
            network: 'mainnet',
            address: agentAddress,
            ownerAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: record.id,
            wallets: [record],
        });

        const runGetMethod = vi.fn().mockResolvedValue({
            exitCode: 0,
            stack: [{ type: 'num', value: '123' }],
        });

        const adapter = await AgenticWalletAdapter.create(createSignerStub(), {
            client: createClientStub(runGetMethod),
            network: Network.mainnet(),
            walletAddress: agentAddress,
            onWalletNftIndexResolved: (resolved) => {
                void persistAgenticWalletNftIndex(record.id, resolved.toString());
            },
        });

        await adapter.getWalletNftIndex();
        // Allow the fire-and-forget persist to flush.
        await new Promise((resolve) => setTimeout(resolve, 10));

        const stored = await loadConfigWithMigration();
        expect(stored?.wallets[0]).toMatchObject({ id: record.id, wallet_nft_index: '123' });
    });
});
