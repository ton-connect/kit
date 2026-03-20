/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { existsSync, mkdirSync, unlinkSync } from 'node:fs';

import { MemoryStorageAdapter, Network, Signer, TonWalletKit, WalletV4R2Adapter, WalletV5R1Adapter } from '@ton/walletkit';
import type { TonWalletKit as TonWalletKitType } from '@ton/walletkit';

import { ConfigError, createStandardWalletRecord, CURRENT_TON_CONFIG_VERSION, normalizeConfig } from './config.js';
import type { StandardWalletVersion, TonConfig, TonConfigVersion, TonNetwork } from './config.js';
import {
    cleanupOrphanSecretFiles,
    deleteAllSecretFiles,
    materializeSecrets,
    migrateFromV2Config,
} from './private-key-files.js';
import type { SecretMaterializationInput } from './private-key-files.js';
import { chmodIfExists, getConfigDir, getConfigPath } from './config-path.js';
import { readFileSync, writeFileSync } from './protected-file.js';
import { createApiClient } from '../utils/ton-client.js';
import { parsePrivateKeyInput } from '../utils/private-key.js';

interface LegacyTonConfig {
    mnemonic?: string;
    private_key?: string;
    network?: TonNetwork;
    wallet_version?: StandardWalletVersion;
    toncenter_api_key?: string;
}

interface PreparedLoadedConfig {
    config: TonConfig;
    shouldPersist: boolean;
    previousConfig: TonConfig | null;
    secretInputs?: SecretMaterializationInput;
}

function isSupportedConfigVersion(version: unknown): version is TonConfigVersion {
    return version === 2 || version === CURRENT_TON_CONFIG_VERSION;
}

function isLegacyConfig(raw: unknown): raw is LegacyTonConfig {
    if (!raw || typeof raw !== 'object') {
        return false;
    }

    const candidate = raw as Record<string, unknown>;
    return (
        !('version' in candidate) &&
        ('mnemonic' in candidate ||
            'private_key' in candidate ||
            'network' in candidate ||
            'wallet_version' in candidate ||
            'toncenter_api_key' in candidate)
    );
}

function createKit(network: TonNetwork, apiKey?: string): TonWalletKitType {
    const normalized = network === 'testnet' ? Network.testnet() : Network.mainnet();
    return new TonWalletKit({
        networks: {
            [normalized.chainId]: { apiClient: createApiClient(network, apiKey) },
        },
        storage: new MemoryStorageAdapter(),
    });
}

async function closeKitSafely(kit: TonWalletKitType): Promise<void> {
    try {
        await kit.close();
    } catch {
        // Best-effort cleanup for failed initialization.
    }
}

async function deriveLegacyWalletAddress(config: LegacyTonConfig): Promise<string> {
    if (!config.mnemonic && !config.private_key) {
        throw new ConfigError('Legacy config does not contain mnemonic or private_key and cannot be migrated.');
    }

    const network = config.network === 'testnet' ? 'testnet' : 'mainnet';
    const walletVersion = config.wallet_version === 'v4r2' ? 'v4r2' : 'v5r1';
    const kit = createKit(network, config.toncenter_api_key);
    await kit.waitForReady();

    try {
        const signer = config.mnemonic
            ? await Signer.fromMnemonic(config.mnemonic.trim().split(/\s+/), { type: 'ton' })
            : await Signer.fromPrivateKey(parsePrivateKeyInput(config.private_key!).seed);
        const networkObject = network === 'testnet' ? Network.testnet() : Network.mainnet();
        const adapter =
            walletVersion === 'v4r2'
                ? await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(networkObject),
                      network: networkObject,
                  })
                : await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(networkObject),
                      network: networkObject,
                  });
        return adapter.getAddress();
    } finally {
        await closeKitSafely(kit);
    }
}

async function migrateLegacyConfig(legacy: LegacyTonConfig): Promise<{
    config: TonConfig;
    secretInputs: SecretMaterializationInput;
}> {
    const network = legacy.network === 'testnet' ? 'testnet' : 'mainnet';
    const walletVersion = legacy.wallet_version === 'v4r2' ? 'v4r2' : 'v5r1';
    const address = await deriveLegacyWalletAddress(legacy);
    const migratedWallet = createStandardWalletRecord({
        name: 'Migrated wallet',
        network,
        walletVersion,
        address,
        idPrefix: 'migrated-wallet',
    });

    return {
        config: {
            version: CURRENT_TON_CONFIG_VERSION,
            active_wallet_id: migratedWallet.id,
            networks: {
                [network]: legacy.toncenter_api_key
                    ? {
                          toncenter_api_key: legacy.toncenter_api_key,
                      }
                    : undefined,
            },
            wallets: [migratedWallet],
            pending_agentic_deployments: [],
            pending_agentic_key_rotations: [],
            agentic_setup_sessions: [],
        },
        secretInputs: {
            wallets: {
                [migratedWallet.id]: {
                    ...(legacy.mnemonic?.trim() ? { mnemonic: legacy.mnemonic.trim() } : {}),
                    ...(legacy.private_key?.trim() ? { private_key: legacy.private_key.trim() } : {}),
                },
            },
        },
    };
}

function writeConfigFile(config: TonConfig): TonConfig {
    mkdirSync(getConfigDir(), { recursive: true, mode: 0o700 });
    chmodIfExists(getConfigDir(), 0o700);
    writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + '\n', {
        mode: 0o600,
    });
    chmodIfExists(getConfigDir(), 0o700);
    chmodIfExists(getConfigPath(), 0o600);
    return config;
}

export function saveConfigTransition(
    previousConfig: TonConfig | null | undefined,
    nextConfig: TonConfig,
    secretInputs?: SecretMaterializationInput,
): TonConfig {
    const writtenConfig = writeConfigFile(normalizeConfig(materializeSecrets(nextConfig, secretInputs)));
    cleanupOrphanSecretFiles(previousConfig, writtenConfig);
    return writtenConfig;
}

export function saveConfig(config: TonConfig, secretInputs?: SecretMaterializationInput): TonConfig {
    return saveConfigTransition(undefined, config, secretInputs);
}

function parseConfigFile(): { configPath: string; raw: unknown } | null {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
        return null;
    }

    try {
        return {
            configPath,
            raw: JSON.parse(readFileSync(configPath)),
        };
    } catch (error) {
        throw new ConfigError(
            `Failed to read config at ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

async function prepareLoadedConfig(
    raw: unknown,
    options: { allowLegacyMigration: boolean; persistCurrentVersion: boolean },
): Promise<PreparedLoadedConfig> {
    if (isLegacyConfig(raw)) {
        if (!options.allowLegacyMigration) {
            throw new ConfigError('Unsupported legacy config.');
        }

        const migrated = await migrateLegacyConfig(raw);
        return {
            config: migrated.config,
            shouldPersist: true,
            previousConfig: null,
            secretInputs: migrated.secretInputs,
        };
    }

    return prepareVersionedConfig(raw, options);
}

function prepareVersionedConfig(raw: unknown, options: { persistCurrentVersion: boolean }): PreparedLoadedConfig {
    if (!raw || typeof raw !== 'object' || !('version' in raw)) {
        throw new ConfigError('Unsupported config format.');
    }

    const version = raw.version;
    if (!isSupportedConfigVersion(version)) {
        throw new ConfigError(`Unsupported config version ${String(version)}.`);
    }

    const migrated = migrateFromV2Config(raw as TonConfig);
    return {
        config: migrated.config,
        shouldPersist: options.persistCurrentVersion && (migrated.changed || version !== CURRENT_TON_CONFIG_VERSION),
        previousConfig: raw as TonConfig,
    };
}

function finalizeLoadedConfig(prepared: PreparedLoadedConfig): TonConfig {
    return prepared.shouldPersist
        ? saveConfigTransition(prepared.previousConfig, prepared.config, prepared.secretInputs)
        : normalizeConfig(prepared.config);
}

export async function loadConfig(): Promise<TonConfig | null> {
    const parsed = parseConfigFile();
    if (!parsed) {
        return null;
    }

    return await finalizeLoadedConfig(
        await prepareLoadedConfig(parsed.raw, { allowLegacyMigration: true, persistCurrentVersion: true }),
    );
}

export function deleteConfig(): boolean {
    try {
        const parsed = parseConfigFile();
        if (!parsed) {
            return false;
        }

        if (
            parsed.raw &&
            typeof parsed.raw === 'object' &&
            'version' in parsed.raw &&
            isSupportedConfigVersion((parsed.raw as { version?: unknown }).version)
        ) {
            deleteAllSecretFiles(migrateFromV2Config(parsed.raw as TonConfig).config);
        }

        if (existsSync(getConfigPath())) {
            unlinkSync(getConfigPath());
        }
        return true;
    } catch {
        return false;
    }
}
