/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { chmodSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import {
    MemoryStorageAdapter,
    Network,
    Signer,
    TonWalletKit,
    WalletV4R2Adapter,
    WalletV5R1Adapter,
} from '@ton/walletkit';

import { formatAssetAddress, formatWalletAddress, normalizeAddressForComparison } from '../utils/address.js';
import { parsePrivateKeyInput } from '../utils/private-key.js';
import { createApiClient } from '../utils/ton-client.js';
import { readMaybeEncryptedFile, writeEncryptedFile } from './protected-file.js';

export type TonNetwork = 'mainnet' | 'testnet';
export type StandardWalletVersion = 'v5r1' | 'v4r2';
export type StoredWalletType = 'standard' | 'agentic';

export interface ConfigNetwork {
    toncenter_api_key?: string;
    agentic_collection_address?: string;
}

export interface StoredWalletBase {
    id: string;
    name: string;
    type: StoredWalletType;
    network: TonNetwork;
    address: string;
    removed?: boolean;
    removed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface StoredStandardWallet extends StoredWalletBase {
    type: 'standard';
    wallet_version: StandardWalletVersion;
    mnemonic?: string;
    private_key?: string;
}

export interface StoredAgenticWallet extends StoredWalletBase {
    type: 'agentic';
    owner_address: string;
    operator_private_key?: string;
    operator_public_key?: string;
    source?: string;
    collection_address?: string;
    origin_operator_public_key?: string;
    deployed_by_user?: boolean;
}

export type StoredWallet = StoredStandardWallet | StoredAgenticWallet;

export interface PendingAgenticDeployment {
    id: string;
    network: TonNetwork;
    operator_private_key: string;
    operator_public_key: string;
    name?: string;
    source?: string;
    collection_address?: string;
    created_at: string;
    updated_at: string;
}

export interface PendingAgenticKeyRotation {
    id: string;
    wallet_id: string;
    network: TonNetwork;
    wallet_address: string;
    owner_address: string;
    collection_address?: string;
    operator_private_key: string;
    operator_public_key: string;
    created_at: string;
    updated_at: string;
}

export type AgenticSetupStatus = 'pending' | 'callback_received' | 'completed' | 'cancelled' | 'expired';

export interface StoredAgenticSetupSession {
    setup_id: string;
    callback_url: string;
    status: AgenticSetupStatus;
    created_at: string;
    expires_at: string;
    payload?: {
        event: 'agent_wallet_deployed';
        network?: {
            chainId?: string | number;
            collectionAddress?: string;
        };
        wallet?: {
            address?: string;
            ownerAddress?: string;
            originOperatorPublicKey?: string;
            operatorPublicKey?: string;
            deployedByUser?: boolean;
            name?: string;
            source?: string;
        };
    };
}

export interface TonConfig {
    version: 2;
    active_wallet_id: string | null;
    networks: {
        mainnet?: ConfigNetwork;
        testnet?: ConfigNetwork;
    };
    wallets: StoredWallet[];
    pending_agentic_deployments?: PendingAgenticDeployment[];
    pending_agentic_key_rotations?: PendingAgenticKeyRotation[];
    agentic_setup_sessions?: StoredAgenticSetupSession[];
}

interface LegacyTonConfig {
    mnemonic?: string;
    private_key?: string;
    network?: TonNetwork;
    wallet_version?: StandardWalletVersion;
    toncenter_api_key?: string;
}

export class ConfigError extends Error {}

const DEFAULT_CONFIG_FILE = join(homedir(), '.config', 'ton', 'config.json');
const ENV_CONFIG_PATH = 'TON_CONFIG_PATH';
export const DEFAULT_AGENTIC_COLLECTION_ADDRESS = 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07';

function nowIso(): string {
    return new Date().toISOString();
}

function isWalletRemoved(wallet: StoredWallet): boolean {
    return wallet.removed === true;
}

function normalizeConfig(raw: TonConfig): TonConfig {
    const normalizePendingDeployment = (deployment: PendingAgenticDeployment): PendingAgenticDeployment => ({
        ...deployment,
        ...(deployment.name ? { name: deployment.name.trim() } : {}),
        ...(deployment.source ? { source: deployment.source.trim() } : {}),
        ...(deployment.collection_address
            ? {
                  collection_address: formatAssetAddress(deployment.collection_address, deployment.network),
              }
            : {}),
    });
    const normalizePendingKeyRotation = (rotation: PendingAgenticKeyRotation): PendingAgenticKeyRotation => ({
        ...rotation,
        wallet_address: formatWalletAddress(rotation.wallet_address, rotation.network),
        owner_address: formatWalletAddress(rotation.owner_address, rotation.network),
        ...(rotation.collection_address
            ? {
                  collection_address: formatAssetAddress(rotation.collection_address, rotation.network),
              }
            : {}),
    });
    const normalizeStoredWallet = (wallet: StoredWallet): StoredWallet =>
        wallet.type === 'standard'
            ? {
                  ...wallet,
                  address: formatWalletAddress(wallet.address, wallet.network),
              }
            : {
                  ...wallet,
                  address: formatWalletAddress(wallet.address, wallet.network),
                  owner_address: formatWalletAddress(wallet.owner_address, wallet.network),
                  ...(wallet.collection_address
                      ? {
                            collection_address: formatAssetAddress(wallet.collection_address, wallet.network),
                        }
                      : {}),
              };
    const normalizeSetupSession = (session: StoredAgenticSetupSession): StoredAgenticSetupSession => ({
        ...session,
    });

    return {
        version: 2,
        active_wallet_id: raw.active_wallet_id ?? null,
        networks: {
            mainnet: raw.networks?.mainnet
                ? {
                      ...raw.networks.mainnet,
                      ...(raw.networks.mainnet.agentic_collection_address
                          ? {
                                agentic_collection_address: formatAssetAddress(
                                    raw.networks.mainnet.agentic_collection_address,
                                    'mainnet',
                                ),
                            }
                          : {}),
                  }
                : undefined,
            testnet: raw.networks?.testnet
                ? {
                      ...raw.networks.testnet,
                      ...(raw.networks.testnet.agentic_collection_address
                          ? {
                                agentic_collection_address: formatAssetAddress(
                                    raw.networks.testnet.agentic_collection_address,
                                    'testnet',
                                ),
                            }
                          : {}),
                  }
                : undefined,
        },
        wallets: Array.isArray(raw.wallets) ? raw.wallets.map(normalizeStoredWallet) : [],
        ...(Array.isArray(raw.pending_agentic_deployments) && raw.pending_agentic_deployments.length > 0
            ? {
                  pending_agentic_deployments: raw.pending_agentic_deployments.map(normalizePendingDeployment),
              }
            : {}),
        ...(Array.isArray(raw.pending_agentic_key_rotations) && raw.pending_agentic_key_rotations.length > 0
            ? {
                  pending_agentic_key_rotations: raw.pending_agentic_key_rotations.map(normalizePendingKeyRotation),
              }
            : {}),
        ...(Array.isArray(raw.agentic_setup_sessions) && raw.agentic_setup_sessions.length > 0
            ? {
                  agentic_setup_sessions: raw.agentic_setup_sessions.map(normalizeSetupSession),
              }
            : {}),
    };
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

async function deriveLegacyWalletAddress(config: LegacyTonConfig): Promise<string> {
    if (!config.mnemonic && !config.private_key) {
        throw new ConfigError('Legacy config does not contain mnemonic or private_key and cannot be migrated.');
    }

    const network = config.network === 'testnet' ? 'testnet' : 'mainnet';
    const walletVersion = config.wallet_version === 'v4r2' ? 'v4r2' : 'v5r1';
    const kit = new TonWalletKit({
        networks: {
            [(network === 'testnet' ? Network.testnet() : Network.mainnet()).chainId]: {
                apiClient: createApiClient(network, config.toncenter_api_key),
            },
        },
        storage: new MemoryStorageAdapter(),
    });
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
        await kit.close();
    }
}

async function migrateLegacyConfig(legacy: LegacyTonConfig): Promise<TonConfig> {
    const network = legacy.network === 'testnet' ? 'testnet' : 'mainnet';
    const walletVersion = legacy.wallet_version === 'v4r2' ? 'v4r2' : 'v5r1';
    const address = await deriveLegacyWalletAddress(legacy);
    const migratedWallet = createStandardWalletRecord({
        name: 'Migrated wallet',
        network,
        walletVersion,
        address,
        mnemonic: legacy.mnemonic?.trim(),
        privateKey: legacy.private_key?.trim(),
        idPrefix: 'migrated-wallet',
    });

    return {
        version: 2,
        active_wallet_id: migratedWallet.id,
        networks: {
            [network]: legacy.toncenter_api_key
                ? {
                      toncenter_api_key: legacy.toncenter_api_key,
                  }
                : undefined,
        },
        wallets: [migratedWallet],
    };
}

export function getConfigPath(): string {
    return process.env[ENV_CONFIG_PATH]?.trim() || DEFAULT_CONFIG_FILE;
}

export function getConfigDir(): string {
    return dirname(getConfigPath());
}

export function configExists(): boolean {
    return existsSync(getConfigPath());
}

export function createEmptyConfig(): TonConfig {
    return {
        version: 2,
        active_wallet_id: null,
        networks: {},
        wallets: [],
    };
}

function chmodIfExists(path: string, mode: number): void {
    try {
        if (existsSync(path)) {
            chmodSync(path, mode);
        }
    } catch {
        // Best-effort only.
    }
}

export function ensureConfigPermissions(): void {
    chmodIfExists(getConfigDir(), 0o700);
    chmodIfExists(getConfigPath(), 0o600);
}

export async function loadConfigWithMigration(): Promise<TonConfig | null> {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
        return null;
    }

    let raw: unknown;
    let isProtected: boolean;
    try {
        const readResult = readMaybeEncryptedFile(configPath);
        raw = JSON.parse(readResult.content);
        isProtected = readResult.isProtected;
    } catch (error) {
        throw new ConfigError(
            `Failed to read config at ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }

    if (isLegacyConfig(raw)) {
        const migrated = await migrateLegacyConfig(raw);
        saveConfig(migrated);
        return migrated;
    }

    if (!raw || typeof raw !== 'object' || !('version' in raw)) {
        throw new ConfigError(`Unsupported config format at ${configPath}.`);
    }

    const version = (raw as { version?: unknown }).version;
    if (version !== 2) {
        throw new ConfigError(`Unsupported config version ${String(version)} at ${configPath}.`);
    }

    const normalized = normalizeConfig(raw as TonConfig);
    if (!isProtected) {
        saveConfig(normalized);
    }
    return normalized;
}

export function saveConfig(config: TonConfig): void {
    mkdirSync(getConfigDir(), { recursive: true, mode: 0o700 });
    chmodIfExists(getConfigDir(), 0o700);
    writeEncryptedFile(getConfigPath(), JSON.stringify(normalizeConfig(config), null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
    });
    ensureConfigPermissions();
}

export function deleteConfig(): boolean {
    try {
        if (existsSync(getConfigPath())) {
            unlinkSync(getConfigPath());
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function listWallets(config: TonConfig): StoredWallet[] {
    return config.wallets.filter((wallet) => !isWalletRemoved(wallet));
}

export function getActiveWallet(config: TonConfig): StoredWallet | null {
    if (!config.active_wallet_id) {
        return null;
    }
    return config.wallets.find((wallet) => wallet.id === config.active_wallet_id && !isWalletRemoved(wallet)) ?? null;
}

export function findWallet(config: TonConfig, selector: string): StoredWallet | null {
    const normalized = selector.trim().toLowerCase();
    const normalizedRawAddress = normalizeAddressForComparison(selector);
    if (!normalized) {
        return null;
    }

    const exact = config.wallets.find((wallet) => {
        if (isWalletRemoved(wallet)) {
            return false;
        }
        return (
            wallet.id.toLowerCase() === normalized ||
            wallet.name.toLowerCase() === normalized ||
            wallet.address.toLowerCase() === normalized ||
            (normalizedRawAddress !== null &&
                normalizeAddressForComparison(wallet.address)?.toLowerCase() === normalizedRawAddress.toLowerCase())
        );
    });
    if (exact) {
        return exact;
    }

    const partial = config.wallets.find(
        (wallet) =>
            !isWalletRemoved(wallet) &&
            (wallet.id.toLowerCase().startsWith(normalized) || wallet.address.toLowerCase().startsWith(normalized)),
    );
    return partial ?? null;
}

export function findWalletByAddress(config: TonConfig, network: TonNetwork, address: string): StoredWallet | null {
    const normalizedAddress = normalizeAddressForComparison(address);
    if (!normalizedAddress) {
        return null;
    }

    return (
        config.wallets.find(
            (wallet) =>
                !isWalletRemoved(wallet) &&
                wallet.network === network &&
                normalizeAddressForComparison(wallet.address)?.toLowerCase() === normalizedAddress.toLowerCase(),
        ) ?? null
    );
}

function touchWallet<T extends StoredWallet>(wallet: T): T {
    return {
        ...wallet,
        updated_at: nowIso(),
    };
}

export function upsertWallet(config: TonConfig, wallet: StoredWallet, options?: { setActive?: boolean }): TonConfig {
    const duplicate = findWalletByAddress(config, wallet.network, wallet.address);
    if (duplicate && duplicate.id !== wallet.id) {
        throw new ConfigError(
            `Wallet address ${wallet.address} is already configured as "${duplicate.name}" (${duplicate.id}) on ${wallet.network}.`,
        );
    }

    const existingIndex = config.wallets.findIndex((item) => item.id === wallet.id);
    const now = nowIso();
    const nextWallet =
        existingIndex === -1
            ? { ...wallet, created_at: wallet.created_at || now, updated_at: wallet.updated_at || now }
            : {
                  ...config.wallets[existingIndex],
                  ...wallet,
                  created_at: config.wallets[existingIndex].created_at,
                  updated_at: now,
              };

    const nextWallets = [...config.wallets];
    if (existingIndex === -1) {
        nextWallets.push(nextWallet);
    } else {
        nextWallets[existingIndex] = nextWallet;
    }

    return {
        ...config,
        wallets: nextWallets.map((item) => (item.id === nextWallet.id ? nextWallet : item)),
        active_wallet_id: options?.setActive ? nextWallet.id : config.active_wallet_id,
    };
}

export function removeWallet(config: TonConfig, selector: string): { config: TonConfig; removed: StoredWallet | null } {
    const wallet = findWallet(config, selector);
    if (!wallet) {
        return { config, removed: null };
    }

    const removedWallet = {
        ...wallet,
        removed: true,
        removed_at: nowIso(),
        updated_at: nowIso(),
    };
    const nextWallets = config.wallets.map((item) => (item.id === wallet.id ? removedWallet : item));
    const nextVisibleWallets = nextWallets.filter((item) => !isWalletRemoved(item));
    const nextActive =
        config.active_wallet_id === wallet.id ? (nextVisibleWallets[0]?.id ?? null) : (config.active_wallet_id ?? null);

    return {
        removed: removedWallet,
        config: {
            ...config,
            wallets: nextWallets,
            active_wallet_id: nextActive,
        },
    };
}

export function setActiveWallet(
    config: TonConfig,
    selector: string,
): { config: TonConfig; wallet: StoredWallet | null } {
    const wallet = findWallet(config, selector);
    if (!wallet) {
        return { config, wallet: null };
    }

    return {
        wallet,
        config: {
            ...config,
            active_wallet_id: wallet.id,
            wallets: config.wallets.map((item) => (item.id === wallet.id ? touchWallet(item) : item)),
        },
    };
}

export function listPendingAgenticDeployments(config: TonConfig): PendingAgenticDeployment[] {
    return [...(config.pending_agentic_deployments ?? [])];
}

export function listPendingAgenticKeyRotations(config: TonConfig): PendingAgenticKeyRotation[] {
    return [...(config.pending_agentic_key_rotations ?? [])];
}

export function listAgenticSetupSessions(config: TonConfig): StoredAgenticSetupSession[] {
    return [...(config.agentic_setup_sessions ?? [])];
}

export function findPendingAgenticDeployment(
    config: TonConfig,
    input: {
        id?: string;
        network?: TonNetwork;
        operatorPublicKey?: string;
    },
): PendingAgenticDeployment | null {
    return (
        (config.pending_agentic_deployments ?? []).find((deployment) => {
            if (input.id && deployment.id !== input.id) {
                return false;
            }
            if (input.network && deployment.network !== input.network) {
                return false;
            }
            if (
                input.operatorPublicKey &&
                deployment.operator_public_key.trim().toLowerCase() !== input.operatorPublicKey.trim().toLowerCase()
            ) {
                return false;
            }
            return true;
        }) ?? null
    );
}

export function upsertPendingAgenticDeployment(config: TonConfig, deployment: PendingAgenticDeployment): TonConfig {
    const pendingDeployments = config.pending_agentic_deployments ?? [];
    const existingIndex = pendingDeployments.findIndex((item) => item.id === deployment.id);
    const now = nowIso();
    const existingDeployment = existingIndex === -1 ? null : pendingDeployments[existingIndex]!;
    const nextDeployment = !existingDeployment
        ? {
              ...deployment,
              created_at: deployment.created_at || now,
              updated_at: deployment.updated_at || now,
          }
        : {
              ...existingDeployment,
              ...deployment,
              created_at: existingDeployment.created_at,
              updated_at: now,
          };

    const nextDeployments = [...pendingDeployments];
    if (existingIndex === -1) {
        nextDeployments.push(nextDeployment);
    } else {
        nextDeployments[existingIndex] = nextDeployment;
    }

    return {
        ...config,
        ...(nextDeployments.length > 0 ? { pending_agentic_deployments: nextDeployments } : {}),
    };
}

export function findPendingAgenticKeyRotation(
    config: TonConfig,
    input: {
        id?: string;
        walletId?: string;
    },
): PendingAgenticKeyRotation | null {
    return (
        (config.pending_agentic_key_rotations ?? []).find((rotation) => {
            if (input.id && rotation.id !== input.id) {
                return false;
            }
            if (input.walletId && rotation.wallet_id !== input.walletId) {
                return false;
            }
            return true;
        }) ?? null
    );
}

export function upsertPendingAgenticKeyRotation(config: TonConfig, rotation: PendingAgenticKeyRotation): TonConfig {
    const rotations = config.pending_agentic_key_rotations ?? [];
    const existingIndex = rotations.findIndex((item) => item.id === rotation.id);
    const now = nowIso();
    const existingRotation = existingIndex === -1 ? null : rotations[existingIndex]!;
    const nextRotation = !existingRotation
        ? {
              ...rotation,
              created_at: rotation.created_at || now,
              updated_at: rotation.updated_at || now,
          }
        : {
              ...existingRotation,
              ...rotation,
              created_at: existingRotation.created_at,
              updated_at: now,
          };

    const nextRotations = [...rotations];
    if (existingIndex === -1) {
        nextRotations.push(nextRotation);
    } else {
        nextRotations[existingIndex] = nextRotation;
    }

    return {
        ...config,
        ...(nextRotations.length > 0 ? { pending_agentic_key_rotations: nextRotations } : {}),
    };
}

export function removePendingAgenticDeployment(
    config: TonConfig,
    input: {
        id?: string;
        network?: TonNetwork;
        operatorPublicKey?: string;
    },
): TonConfig {
    const nextDeployments = (config.pending_agentic_deployments ?? []).filter((deployment) => {
        if (input.id && deployment.id === input.id) {
            return false;
        }

        if (
            input.network &&
            input.operatorPublicKey &&
            deployment.network === input.network &&
            deployment.operator_public_key.trim().toLowerCase() === input.operatorPublicKey.trim().toLowerCase()
        ) {
            return false;
        }

        return true;
    });

    if (nextDeployments.length === 0) {
        const { pending_agentic_deployments: _pending, ...rest } = config;
        return rest;
    }

    return {
        ...config,
        pending_agentic_deployments: nextDeployments,
    };
}

export function removePendingAgenticKeyRotation(
    config: TonConfig,
    input: {
        id?: string;
        walletId?: string;
    },
): TonConfig {
    const nextRotations = (config.pending_agentic_key_rotations ?? []).filter((rotation) => {
        if (input.id && rotation.id === input.id) {
            return false;
        }
        if (input.walletId && rotation.wallet_id === input.walletId) {
            return false;
        }
        return true;
    });

    if (nextRotations.length === 0) {
        const { pending_agentic_key_rotations: _rotations, ...rest } = config;
        return rest;
    }

    return {
        ...config,
        pending_agentic_key_rotations: nextRotations,
    };
}

export function findAgenticSetupSession(config: TonConfig, setupId: string): StoredAgenticSetupSession | null {
    return (config.agentic_setup_sessions ?? []).find((session) => session.setup_id === setupId) ?? null;
}

export function upsertAgenticSetupSession(config: TonConfig, session: StoredAgenticSetupSession): TonConfig {
    const sessions = config.agentic_setup_sessions ?? [];
    const existingIndex = sessions.findIndex((item) => item.setup_id === session.setup_id);
    const nextSessions = [...sessions];

    if (existingIndex === -1) {
        nextSessions.push(session);
    } else {
        nextSessions[existingIndex] = session;
    }

    return {
        ...config,
        agentic_setup_sessions: nextSessions,
    };
}

export function removeAgenticSetupSession(config: TonConfig, setupId: string): TonConfig {
    const nextSessions = (config.agentic_setup_sessions ?? []).filter((session) => session.setup_id !== setupId);

    if (nextSessions.length === 0) {
        const { agentic_setup_sessions: _sessions, ...rest } = config;
        return rest;
    }

    return {
        ...config,
        agentic_setup_sessions: nextSessions,
    };
}

export function updateNetworkConfig(config: TonConfig, network: TonNetwork, patch: Partial<ConfigNetwork>): TonConfig {
    return {
        ...config,
        networks: {
            ...config.networks,
            [network]: {
                ...(config.networks[network] ?? {}),
                ...patch,
                ...(patch.agentic_collection_address
                    ? {
                          agentic_collection_address: formatAssetAddress(patch.agentic_collection_address, network),
                      }
                    : {}),
            },
        },
    };
}

export function normalizeNetwork(value: string | undefined | null, fallback: TonNetwork = 'mainnet'): TonNetwork {
    return value === 'testnet' ? 'testnet' : fallback;
}

export function normalizeWalletVersion(
    value: string | undefined | null,
    fallback: StandardWalletVersion = 'v5r1',
): StandardWalletVersion {
    return value === 'v4r2' ? 'v4r2' : fallback;
}

export function getToncenterApiKey(config: TonConfig | null, network: TonNetwork): string | undefined {
    const envKey = process.env.TONCENTER_API_KEY?.trim();
    if (envKey) {
        return envKey;
    }
    return config?.networks[network]?.toncenter_api_key?.trim() || undefined;
}

export function getAgenticCollectionAddress(config: TonConfig | null, network: TonNetwork): string | undefined {
    return (
        config?.networks[network]?.agentic_collection_address?.trim() ||
        formatAssetAddress(DEFAULT_AGENTIC_COLLECTION_ADDRESS, network)
    );
}

export function createWalletId(prefix: string): string {
    const safe = prefix
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const suffix = Math.random().toString(36).slice(2, 8);
    return safe ? `${safe}-${suffix}` : suffix;
}

export function createStandardWalletRecord(input: {
    name: string;
    network: TonNetwork;
    walletVersion: StandardWalletVersion;
    address: string;
    mnemonic?: string;
    privateKey?: string;
    idPrefix?: string;
}): StoredStandardWallet {
    const now = nowIso();
    return {
        id: createWalletId(input.idPrefix ?? input.name),
        name: input.name,
        type: 'standard',
        network: input.network,
        wallet_version: input.walletVersion,
        address: formatWalletAddress(input.address, input.network),
        ...(input.mnemonic ? { mnemonic: input.mnemonic } : {}),
        ...(input.privateKey ? { private_key: input.privateKey } : {}),
        created_at: now,
        updated_at: now,
    };
}

export function createAgenticWalletRecord(input: {
    name: string;
    network: TonNetwork;
    address: string;
    ownerAddress: string;
    operatorPrivateKey?: string;
    operatorPublicKey?: string;
    source?: string;
    collectionAddress?: string;
    originOperatorPublicKey?: string;
    deployedByUser?: boolean;
    idPrefix?: string;
}): StoredAgenticWallet {
    const now = nowIso();
    return {
        id: createWalletId(input.idPrefix ?? input.name),
        name: input.name,
        type: 'agentic',
        network: input.network,
        address: formatWalletAddress(input.address, input.network),
        owner_address: formatWalletAddress(input.ownerAddress, input.network),
        ...(input.operatorPrivateKey ? { operator_private_key: input.operatorPrivateKey } : {}),
        ...(input.operatorPublicKey ? { operator_public_key: input.operatorPublicKey } : {}),
        ...(input.source ? { source: input.source } : {}),
        ...(input.collectionAddress
            ? { collection_address: formatAssetAddress(input.collectionAddress, input.network) }
            : {}),
        ...(input.originOperatorPublicKey ? { origin_operator_public_key: input.originOperatorPublicKey } : {}),
        ...(typeof input.deployedByUser === 'boolean' ? { deployed_by_user: input.deployedByUser } : {}),
        created_at: now,
        updated_at: now,
    };
}

export function createPendingAgenticDeployment(input: {
    network: TonNetwork;
    operatorPrivateKey: string;
    operatorPublicKey: string;
    name?: string;
    source?: string;
    collectionAddress?: string;
    idPrefix?: string;
}): PendingAgenticDeployment {
    const now = nowIso();
    return {
        id: createWalletId(input.idPrefix ?? input.name ?? 'pending-agentic'),
        network: input.network,
        operator_private_key: input.operatorPrivateKey,
        operator_public_key: input.operatorPublicKey,
        ...(input.name?.trim() ? { name: input.name.trim() } : {}),
        ...(input.source?.trim() ? { source: input.source.trim() } : {}),
        ...(input.collectionAddress
            ? { collection_address: formatAssetAddress(input.collectionAddress, input.network) }
            : {}),
        created_at: now,
        updated_at: now,
    };
}

export function createPendingAgenticKeyRotation(input: {
    walletId: string;
    network: TonNetwork;
    walletAddress: string;
    ownerAddress: string;
    collectionAddress?: string;
    operatorPrivateKey: string;
    operatorPublicKey: string;
    idPrefix?: string;
}): PendingAgenticKeyRotation {
    const now = nowIso();
    return {
        id: createWalletId(input.idPrefix ?? 'pending-agentic-key-rotation'),
        wallet_id: input.walletId,
        network: input.network,
        wallet_address: formatWalletAddress(input.walletAddress, input.network),
        owner_address: formatWalletAddress(input.ownerAddress, input.network),
        ...(input.collectionAddress
            ? { collection_address: formatAssetAddress(input.collectionAddress, input.network) }
            : {}),
        operator_private_key: input.operatorPrivateKey,
        operator_public_key: input.operatorPublicKey,
        created_at: now,
        updated_at: now,
    };
}
