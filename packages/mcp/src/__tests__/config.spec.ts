/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    chmodSync,
    existsSync,
    mkdtempSync,
    readFileSync as rawReadFileSync,
    rmSync,
    statSync,
    writeFileSync as rawWriteFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    ConfigError,
    CURRENT_TON_CONFIG_VERSION,
    DEFAULT_AGENTIC_COLLECTION_ADDRESS,
    createAgenticWalletRecord,
    createEmptyConfig,
    createPendingAgenticDeployment,
    createStandardWalletRecord,
    findWallet,
    getActiveWallet,
    getAgenticCollectionAddress,
    removePendingAgenticDeployment,
    removeWallet,
    setActiveWallet,
    upsertPendingAgenticDeployment,
    upsertWallet,
} from '../registry/config.js';
import {
    deleteConfig,
    loadConfig,
    saveConfig,
    saveConfigTransition,
} from '../registry/config-persistence.js';
import { readFileSync } from '../registry/protected-file.js';
import { LEGACY_AGENTIC_PRIVATE_KEY_FIELD } from '../registry/private-key-field.js';

describe('mcp config registry', () => {
    const baseAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    function resolveSecretPath(filePath: string): string {
        return resolve(dirname(process.env.TON_CONFIG_PATH!), filePath);
    }

    function walletSecrets(id: string, secret: { mnemonic?: string; private_key?: string }) {
        return { wallets: { [id]: secret } };
    }

    function pendingDeploymentSecrets(id: string, privateKey: string) {
        return { pendingAgenticDeployments: { [id]: privateKey } };
    }

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

    it('saves config with strict permissions and reads it back', async () => {
        const standard = createStandardWalletRecord({
            name: 'Main wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        const config = upsertWallet(createEmptyConfig(), standard, { setActive: true });

        saveConfig(config, walletSecrets(standard.id, { mnemonic: 'a '.repeat(24).trim() }));

        const loaded = await loadConfig();
        expect(loaded?.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect(loaded?.wallets).toHaveLength(1);
        expect(loaded?.active_wallet_id).toBe(standard.id);
        expect(loaded?.wallets[0]).toMatchObject({
            secret_file: expect.any(String),
            secret_type: 'mnemonic',
        });
        expect(
            readFileSync(
                loaded?.wallets[0]?.type === 'standard' ? resolveSecretPath(loaded.wallets[0].secret_file!) : '',
                'utf-8',
            ).trim(),
        ).toBe('a '.repeat(24).trim());
        expect(
            rawReadFileSync(
                loaded?.wallets[0]?.type === 'standard' ? resolveSecretPath(loaded.wallets[0].secret_file!) : '',
                'utf-8',
            ),
        ).not.toContain('a '.repeat(24).trim());

        const fileMode = statSync(process.env.TON_CONFIG_PATH!).mode & 0o777;
        expect(fileMode).toBe(0o600);
        const mnemonicFileMode =
            statSync(resolveSecretPath((loaded?.wallets[0] as { secret_file: string }).secret_file)).mode & 0o777;
        expect(mnemonicFileMode).toBe(0o600);
    });

    it('migrates legacy config payloads to the current version on first read', async () => {
        rawWriteFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                mnemonic: 'abandon '.repeat(23) + 'about',
                network: 'testnet',
                wallet_version: 'v4r2',
                toncenter_api_key: 'legacy-key',
            }),
            'utf-8',
        );

        const migrated = await loadConfig();
        expect(migrated?.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect(migrated?.wallets).toHaveLength(1);
        expect(migrated?.wallets[0]?.name).toBe('Migrated wallet');
        expect(migrated?.wallets[0]?.type).toBe('standard');
        expect(migrated?.wallets[0]?.network).toBe('testnet');
        expect(migrated?.networks.testnet?.toncenter_api_key).toBe('legacy-key');
        expect(migrated?.wallets[0]).toMatchObject({
            secret_file: expect.any(String),
            secret_type: 'mnemonic',
        });
    });

    it('upgrades inline secrets from v2 payloads on load', async () => {
        rawWriteFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                version: 2,
                active_wallet_id: 'wallet-1',
                networks: {},
                wallets: [
                    {
                        id: 'wallet-1',
                        type: 'standard',
                        name: 'Inline standard',
                        network: 'mainnet',
                        wallet_version: 'v5r1',
                        address: baseAddress,
                        mnemonic: 'abandon '.repeat(23) + 'about',
                        private_key: '0x' + '11'.repeat(32),
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                    {
                        id: 'wallet-2',
                        type: 'agentic',
                        name: 'Inline agent',
                        network: 'mainnet',
                        address: baseAddress,
                        owner_address: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
                        [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: '0x' + '22'.repeat(32),
                        operator_public_key: '0xbeef',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
                pending_agentic_deployments: [
                    {
                        id: 'setup-1',
                        network: 'mainnet',
                        [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: '0x' + '33'.repeat(32),
                        operator_public_key: '0xcafe',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
                pending_agentic_key_rotations: [
                    {
                        id: 'rotation-1',
                        wallet_id: 'wallet-2',
                        network: 'mainnet',
                        wallet_address: baseAddress,
                        owner_address: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
                        [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: '0x' + '44'.repeat(32),
                        operator_public_key: '0xfade',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
            }),
            'utf-8',
        );

        const loaded = await loadConfig();
        expect(loaded?.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect(loaded?.wallets[0]).toMatchObject({
            secret_file: expect.any(String),
            secret_type: 'mnemonic',
        });
        expect(loaded?.wallets[1]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(loaded?.pending_agentic_deployments?.[0]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(loaded?.pending_agentic_key_rotations?.[0]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(loaded?.wallets[1]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(loaded?.pending_agentic_deployments?.[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(loaded?.pending_agentic_key_rotations?.[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(loaded?.wallets[1]).not.toHaveProperty('secret_type');
        expect(loaded?.pending_agentic_deployments?.[0]).not.toHaveProperty('secret_type');
        expect(loaded?.pending_agentic_key_rotations?.[0]).not.toHaveProperty('secret_type');

        const persisted = JSON.parse(readFileSync(process.env.TON_CONFIG_PATH!)) as Record<string, unknown>;
        expect(persisted.version).toBe(CURRENT_TON_CONFIG_VERSION);
        const wallets = persisted.wallets as Array<Record<string, unknown>>;
        const deployments = persisted.pending_agentic_deployments as Array<Record<string, unknown>>;
        const rotations = persisted.pending_agentic_key_rotations as Array<Record<string, unknown>>;
        expect(wallets[0]).not.toHaveProperty('mnemonic');
        expect(wallets[0]).toHaveProperty('secret_file');
        expect(wallets[1]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(wallets[1]).toHaveProperty('secret_file');
        expect(deployments[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(deployments[0]).toHaveProperty('secret_file');
        expect(rotations[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(rotations[0]).toHaveProperty('secret_file');
    });

    it('upgrades a v2 config file to the current version on load', async () => {
        rawWriteFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                version: 2,
                active_wallet_id: 'wallet-1',
                networks: {},
                wallets: [
                    {
                        id: 'wallet-1',
                        type: 'standard',
                        name: 'Inline standard',
                        network: 'mainnet',
                        wallet_version: 'v5r1',
                        address: baseAddress,
                        mnemonic: 'abandon '.repeat(23) + 'about',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
            }),
            'utf-8',
        );

        const loaded = await loadConfig();
        expect(loaded?.version).toBe(CURRENT_TON_CONFIG_VERSION);

        const persisted = JSON.parse(readFileSync(process.env.TON_CONFIG_PATH!)) as Record<string, unknown>;
        expect(persisted.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect((persisted.wallets as Array<Record<string, unknown>>)[0]).not.toHaveProperty('mnemonic');
        expect((persisted.wallets as Array<Record<string, unknown>>)[0]).toHaveProperty('secret_file');
        expect(rawReadFileSync(process.env.TON_CONFIG_PATH!, 'utf-8')).not.toContain('"version":');
    });

    it('keeps migrated v2 secrets materialized on explicit save', async () => {
        rawWriteFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                version: 2,
                active_wallet_id: 'wallet-1',
                networks: {},
                wallets: [
                    {
                        id: 'wallet-1',
                        type: 'standard',
                        name: 'Inline standard',
                        network: 'mainnet',
                        wallet_version: 'v5r1',
                        address: baseAddress,
                        mnemonic: 'abandon '.repeat(23) + 'about',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                    {
                        id: 'wallet-2',
                        type: 'agentic',
                        name: 'Inline agent',
                        network: 'mainnet',
                        address: baseAddress,
                        owner_address: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
                        private_key: '0x' + '22'.repeat(32),
                        operator_public_key: '0xbeef',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
                pending_agentic_deployments: [
                    {
                        id: 'setup-1',
                        network: 'mainnet',
                        private_key: '0x' + '33'.repeat(32),
                        operator_public_key: '0xcafe',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
                pending_agentic_key_rotations: [
                    {
                        id: 'rotation-1',
                        wallet_id: 'wallet-2',
                        network: 'mainnet',
                        wallet_address: baseAddress,
                        owner_address: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
                        private_key: '0x' + '44'.repeat(32),
                        operator_public_key: '0xfade',
                        created_at: '2026-03-16T00:00:00.000Z',
                        updated_at: '2026-03-16T00:00:00.000Z',
                    },
                ],
            }),
            'utf-8',
        );

        const loaded = (await loadConfig())!;
        const saved = saveConfigTransition(loaded, loaded);

        expect(saved.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect(saved.wallets[0]).toMatchObject({
            secret_file: expect.any(String),
            secret_type: 'mnemonic',
        });
        expect(saved.wallets[1]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(saved.wallets[1]).not.toHaveProperty('secret_type');
        expect(saved.pending_agentic_deployments?.[0]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(saved.pending_agentic_deployments?.[0]).not.toHaveProperty('secret_type');
        expect(saved.pending_agentic_key_rotations?.[0]).toMatchObject({
            secret_file: expect.any(String),
        });
        expect(saved.pending_agentic_key_rotations?.[0]).not.toHaveProperty('secret_type');
        expect(
            readFileSync(resolveSecretPath((saved.wallets[0] as { secret_file: string }).secret_file), 'utf-8').trim(),
        ).toBe('abandon '.repeat(23) + 'about');
        expect(
            rawReadFileSync(resolveSecretPath((saved.wallets[0] as { secret_file: string }).secret_file), 'utf-8'),
        ).not.toContain('abandon '.repeat(23) + 'about');
        expect(
            readFileSync(
                resolveSecretPath((saved.pending_agentic_key_rotations?.[0] as { secret_file: string }).secret_file),
                'utf-8',
            ).trim(),
        ).toBe('0x' + '44'.repeat(32));
        expect(
            rawReadFileSync(
                resolveSecretPath((saved.pending_agentic_key_rotations?.[0] as { secret_file: string }).secret_file),
                'utf-8',
            ),
        ).not.toContain('0x' + '44'.repeat(32));

        const persisted = JSON.parse(readFileSync(process.env.TON_CONFIG_PATH!)) as Record<string, unknown>;
        const wallets = persisted.wallets as Array<Record<string, unknown>>;
        const deployments = persisted.pending_agentic_deployments as Array<Record<string, unknown>>;
        const rotations = persisted.pending_agentic_key_rotations as Array<Record<string, unknown>>;
        expect(wallets[0]).not.toHaveProperty('mnemonic');
        expect(wallets[0]).not.toHaveProperty('private_key');
        expect(wallets[1]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(deployments[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
        expect(rotations[0]).not.toHaveProperty(LEGACY_AGENTIC_PRIVATE_KEY_FIELD);
    });

    it('selects by explicit wallet selector then active wallet', () => {
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
        expect(findWallet(removed.config, first.id)).toBeUndefined();
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

    it('persists pending agentic deployment drafts in config', async () => {
        const draft = createPendingAgenticDeployment({
            name: 'Pending agent',
            network: 'testnet',
            operatorPublicKey: '0xabcd',
            source: 'Draft source',
            collectionAddress: DEFAULT_AGENTIC_COLLECTION_ADDRESS,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                pending_agentic_deployments: [draft],
            },
            pendingDeploymentSecrets(draft.id, '0x1111'),
        );

        const loaded = await loadConfig();
        expect((loaded ?? createEmptyConfig()).pending_agentic_deployments).toEqual([
            expect.objectContaining({
                id: draft.id,
                name: 'Pending agent',
                network: 'testnet',
                secret_file: expect.any(String),
                operator_public_key: '0xabcd',
                source: 'Draft source',
            }),
        ]);
        expect(
            readFileSync(
                resolveSecretPath(
                    ((loaded ?? createEmptyConfig()).pending_agentic_deployments[0] as { secret_file: string })
                        .secret_file,
                ),
                'utf-8',
            ).trim(),
        ).toBe('0x1111');
        expect(
            rawReadFileSync(
                resolveSecretPath(
                    ((loaded ?? createEmptyConfig()).pending_agentic_deployments[0] as { secret_file: string })
                        .secret_file,
                ),
                'utf-8',
            ),
        ).not.toContain('0x1111');
    });

    it('stores generated secret file paths relative to the config directory', async () => {
        const standard = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: standard.id,
                wallets: [standard],
            },
            walletSecrets(standard.id, { mnemonic: 'abandon '.repeat(23) + 'about' }),
        );

        const loaded = await loadConfig();
        expect((loaded?.wallets[0] as { secret_file: string }).secret_file).toBe(
            `private-keys/wallets/${standard.id}.mnemonic`,
        );
    });

    it('removes pending drafts by id', () => {
        const draft = createPendingAgenticDeployment({
            network: 'mainnet',
            operatorPublicKey: '0xbeef',
        });
        const saved = saveConfigTransition(
            createEmptyConfig(),
            upsertPendingAgenticDeployment(createEmptyConfig(), draft),
            pendingDeploymentSecrets(draft.id, '0x2222'),
        );
        const secretPath = resolveSecretPath(
            (saved.pending_agentic_deployments?.[0] as { secret_file: string }).secret_file,
        );
        const nextConfig = removePendingAgenticDeployment(saved, { id: draft.id });
        saveConfigTransition(saved, nextConfig);
        expect(nextConfig.pending_agentic_deployments).toEqual([]);
        expect(existsSync(secretPath)).toBe(false);
    });

    it('removes wallet secret files when deleting wallets and config', async () => {
        const standard = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: standard.id,
                wallets: [standard],
            },
            walletSecrets(standard.id, { mnemonic: 'abandon '.repeat(23) + 'about' }),
        );

        const loaded = await loadConfig();
        const secretPath = resolveSecretPath((loaded?.wallets[0] as { secret_file: string }).secret_file);
        const removed = removeWallet(loaded ?? createEmptyConfig(), standard.id);
        saveConfigTransition(loaded ?? createEmptyConfig(), removed.config);

        expect(existsSync(secretPath)).toBe(false);

        const other = createStandardWalletRecord({
            name: 'Secondary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: other.id,
                wallets: [other],
            },
            walletSecrets(other.id, {
                mnemonic: 'legal winner thank year wave sausage worth useful legal winner thank yellow',
            }),
        );

        const reloaded = await loadConfig();
        const otherSecretPath = resolveSecretPath((reloaded?.wallets[0] as { secret_file: string }).secret_file);
        expect(deleteConfig()).toBe(true);
        expect(existsSync(process.env.TON_CONFIG_PATH!)).toBe(false);
        expect(existsSync(otherSecretPath)).toBe(false);
    });

    it('does not delete old secret files when config write fails', async () => {
        const standard = createStandardWalletRecord({
            name: 'Primary wallet',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: baseAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: standard.id,
                wallets: [standard],
            },
            walletSecrets(standard.id, { mnemonic: 'abandon '.repeat(23) + 'about' }),
        );

        const loaded = await loadConfig();
        const secretPath = resolveSecretPath((loaded?.wallets[0] as { secret_file: string }).secret_file);
        chmodSync(process.env.TON_CONFIG_PATH!, 0o400);

        try {
            expect(() =>
                saveConfigTransition(
                    loaded ?? createEmptyConfig(),
                    removeWallet(loaded ?? createEmptyConfig(), standard.id).config,
                ),
            ).toThrow();
            expect(existsSync(secretPath)).toBe(true);
            expect(readFileSync(process.env.TON_CONFIG_PATH!)).toContain((loaded?.wallets[0] as { id: string }).id);
        } finally {
            chmodSync(process.env.TON_CONFIG_PATH!, 0o600);
        }
    });

    it('throws for unsupported config version', async () => {
        rawWriteFileSync(
            process.env.TON_CONFIG_PATH!,
            JSON.stringify({
                version: 999,
                wallets: [],
            }),
            'utf-8',
        );

        await expect(loadConfig()).rejects.toThrow(ConfigError);
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
        const config = await loadConfig();
        expect(config?.version).toBe(CURRENT_TON_CONFIG_VERSION);
        expect(config?.wallets.length ?? 0).toBeGreaterThan(0);
    });
});
