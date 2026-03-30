/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { existsSync, mkdtempSync, readFileSync as rawReadFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    ConfigError,
    DEFAULT_AGENTIC_COLLECTION_ADDRESS,
    createAgenticWalletRecord,
    createEmptyConfig,
    createPendingAgenticDeployment,
    createStandardWalletRecord,
    findWallet,
    getActiveWallet,
    getAgenticCollectionAddress,
    listPendingAgenticDeployments,
    loadConfig,
    loadConfigWithMigration,
    removePendingAgenticDeployment,
    removeWallet,
    saveConfig,
    setActiveWallet,
    upsertPendingAgenticDeployment,
    upsertWallet,
} from '../registry/config.js';

describe('mcp config registry', () => {
    const baseAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-config-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
        delete process.env.TONCENTER_API_KEY;
    });

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('saves config with strict permissions and reads it back', () => {
        const standard = createStandardWalletRecord({
            name: 'Main wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
            mnemonic: 'a '.repeat(24).trim(),
        });
        const config = upsertWallet(createEmptyConfig(), standard, { setActive: true });

        saveConfig(config);

        const loaded = loadConfig();
        expect(loaded?.version).toBe(2);
        expect(loaded?.wallets).toHaveLength(1);
        expect(loaded?.active_wallet_id).toBe(standard.id);
        expect(rawReadFileSync(process.env.TON_CONFIG_PATH!, 'utf-8')).not.toContain('"version": 2');
        expect(rawReadFileSync(process.env.TON_CONFIG_PATH!, 'utf-8')).not.toContain(standard.mnemonic ?? '');

        const fileMode = statSync(process.env.TON_CONFIG_PATH!).mode & 0o777;
        expect(fileMode).toBe(0o600);
    });

    it('migrates legacy config payloads to v2 on first read', async () => {
        writeFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                mnemonic: 'abandon '.repeat(23) + 'about',
                network: 'testnet',
                wallet_version: 'v4r2',
                toncenter_api_key: 'legacy-key',
            }),
            'utf-8',
        );

        const migrated = await loadConfigWithMigration();
        expect(migrated?.version).toBe(2);
        expect(migrated?.wallets).toHaveLength(1);
        expect(migrated?.wallets[0]?.name).toBe('Migrated wallet');
        expect(migrated?.wallets[0]?.type).toBe('standard');
        expect(migrated?.wallets[0]?.network).toBe('testnet');
        expect(migrated?.networks.testnet?.toncenter_api_key).toBe('legacy-key');
    });

    it('selects by explicit wallet selector then active wallet', () => {
        const first = createStandardWalletRecord({
            name: 'Main wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
            mnemonic: 'a '.repeat(24).trim(),
        });
        const second = createAgenticWalletRecord({
            name: 'Agent wallet',
            network: 'testnet',
            address: baseAddress,
            ownerAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });

        let config = upsertWallet(createEmptyConfig(), first, { setActive: true });
        config = upsertWallet(config, second);

        expect(findWallet(config, second.id)?.name).toBe('Agent wallet');
        expect(getActiveWallet(config)?.id).toBe(first.id);

        const switched = setActiveWallet(config, second.id);
        expect(switched.wallet?.id).toBe(second.id);
    });

    it('hides soft-deleted wallets from listing, selection, and active lookup', () => {
        const first = createStandardWalletRecord({
            name: 'Main wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        const second = createAgenticWalletRecord({
            name: 'Agent wallet',
            network: 'testnet',
            address: baseAddress,
            ownerAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });

        let config = upsertWallet(createEmptyConfig(), first, { setActive: true });
        config = upsertWallet(config, second);
        const removed = removeWallet(config, first.id);

        expect(removed.removed).toMatchObject({ id: first.id, removed: true });
        expect(findWallet(removed.config, first.id)).toBeNull();
        expect(getActiveWallet(removed.config)?.id).toBe(second.id);
        expect(removed.config.wallets).toEqual([
            expect.objectContaining({ id: first.id, removed: true }),
            expect.objectContaining({ id: second.id }),
        ]);
    });

    it('rejects duplicate normalized addresses on the same network', () => {
        const first = createStandardWalletRecord({
            name: 'Main wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        const duplicate = createAgenticWalletRecord({
            name: 'Duplicate agent',
            network: 'mainnet',
            address: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ',
            ownerAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });

        const config = upsertWallet(createEmptyConfig(), first, { setActive: true });
        expect(() => upsertWallet(config, duplicate)).toThrow(/already configured/i);
    });

    it('uses the default agentic collection address when config is unset', () => {
        expect(getAgenticCollectionAddress(createEmptyConfig(), 'mainnet')).toBeDefined();
        expect(getAgenticCollectionAddress(createEmptyConfig(), 'testnet')).toBeDefined();
    });

    it('persists pending agentic deployment drafts in config', () => {
        const draft = createPendingAgenticDeployment({
            name: 'Pending agent',
            network: 'testnet',
            operatorPrivateKey: '0x1111',
            operatorPublicKey: '0xabcd',
            source: 'Draft source',
            collectionAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });
        const config = upsertPendingAgenticDeployment(createEmptyConfig(), draft);

        saveConfig(config);

        const loaded = loadConfig();
        expect(listPendingAgenticDeployments(loaded ?? createEmptyConfig())).toEqual([
            expect.objectContaining({
                id: draft.id,
                name: 'Pending agent',
                network: 'testnet',
                operator_private_key: '0x1111',
                operator_public_key: '0xabcd',
                source: 'Draft source',
            }),
        ]);
    });

    it('removes pending drafts by id', () => {
        const draft = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPrivateKey: '0x2222',
            operatorPublicKey: '0xbeef',
        });
        const config = upsertPendingAgenticDeployment(createEmptyConfig(), draft);
        const nextConfig = removePendingAgenticDeployment(config, { id: draft.id });
        expect(listPendingAgenticDeployments(nextConfig)).toEqual([]);
    });

    it('throws for unsupported config version', () => {
        writeFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                version: 999,
                wallets: [],
            }),
            'utf-8',
        );

        expect(() => loadConfig()).toThrow(ConfigError);
    });
});

describe('mcp config registry compatibility with real CLI config', () => {
    const realConfigPath = join(homedir(), '.config', 'ton', 'config.json');
    const originalConfigPath = process.env.TON_CONFIG_PATH;

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
    });

    it.skipIf(!existsSync(realConfigPath))('loads the real user config without migration errors', async () => {
        process.env.TON_CONFIG_PATH = realConfigPath;
        const config = await loadConfigWithMigration();
        expect(config?.version).toBe(2);
        expect(config?.wallets.length ?? 0).toBeGreaterThan(0);
    });
});
