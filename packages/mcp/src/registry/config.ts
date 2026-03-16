/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatAssetAddress, formatWalletAddress, normalizeAddressForComparison } from '../utils/address.js';
import { LEGACY_AGENTIC_PRIVATE_KEY_FIELD, readPrivateKeyField } from './private-key-field.js';
import type { LegacyPrivateKeyCompatible } from './private-key-field.js';

export type TonNetwork = 'mainnet' | 'testnet';
export type StandardWalletVersion = 'v5r1' | 'v4r2';
export type StoredWalletType = 'standard' | 'agentic';
export type SecretType = 'mnemonic' | 'private_key';
export type TonConfigVersion = 2 | 3;
export const CURRENT_TON_CONFIG_VERSION = 3 as const;

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
    secret_file?: string;
    secret_type?: SecretType;
}

export interface StoredAgenticWallet extends StoredWalletBase {
    type: 'agentic';
    owner_address: string;
    secret_file?: string;
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
    secret_file?: string;
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
    secret_file?: string;
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
    version: TonConfigVersion;
    active_wallet_id: string | null;
    networks: {
        mainnet?: ConfigNetwork;
        testnet?: ConfigNetwork;
    };
    wallets: StoredWallet[];
    pending_agentic_deployments: PendingAgenticDeployment[];
    pending_agentic_key_rotations: PendingAgenticKeyRotation[];
    agentic_setup_sessions: StoredAgenticSetupSession[];
}

export class ConfigError extends Error {}

export const DEFAULT_AGENTIC_COLLECTION_ADDRESS = 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07';

function nowIso(): string {
    return new Date().toISOString();
}

function toPublicNetwork(network: ConfigNetwork | undefined, currentNetwork: TonNetwork): ConfigNetwork | undefined {
    if (!network) {
        return undefined;
    }

    return {
        ...(network.toncenter_api_key ? { toncenter_api_key: network.toncenter_api_key.trim() } : {}),
        ...(network.agentic_collection_address
            ? {
                  agentic_collection_address: formatAssetAddress(network.agentic_collection_address, currentNetwork),
              }
            : {}),
    };
}

function stripLegacySecretFields<
    T extends {
        secret_file?: string;
        secret_type?: SecretType;
    },
>(
    value: T &
        LegacyPrivateKeyCompatible & {
            mnemonic?: string;
        },
): T {
    const {
        mnemonic: _mnemonic,
        private_key: _privateKey,
        [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: _legacyPrivateKey,
        ...rest
    } = value;

    return rest as T;
}

function normalizeSecretBackedCollection<
    T extends {
        network: TonNetwork;
        collection_address?: string;
        secret_file?: string;
        secret_type?: SecretType;
    },
>(value: T): T {
    const normalized = stripLegacySecretFields(value);
    return {
        ...normalized,
        ...(normalized.collection_address
            ? {
                  collection_address: formatAssetAddress(normalized.collection_address, normalized.network),
              }
            : {}),
    };
}

function normalizeStoredWallet(wallet: StoredWallet): StoredWallet {
    if (wallet.type === 'standard') {
        const normalized = stripLegacySecretFields(wallet);
        const legacy = wallet as StoredStandardWallet & {
            mnemonic?: string;
            private_key?: string;
        };
        const mnemonic = legacy.mnemonic?.trim() || undefined;
        const privateKey = legacy.private_key?.trim() || undefined;
        const secretType = normalized.secret_type ?? (mnemonic ? 'mnemonic' : privateKey ? 'private_key' : undefined);
        return {
            ...normalized,
            name: normalized.name.trim(),
            address: formatWalletAddress(wallet.address, wallet.network),
            ...(secretType ? { secret_type: secretType } : {}),
            ...(normalized.secret_file || !mnemonic ? {} : { mnemonic }),
            ...(normalized.secret_file || mnemonic || !privateKey ? {} : { private_key: privateKey }),
        };
    }

    const normalized = normalizeSecretBackedCollection(wallet);
    const privateKey =
        readPrivateKeyField(wallet as StoredAgenticWallet & LegacyPrivateKeyCompatible)?.trim() || undefined;
    return {
        ...normalized,
        name: normalized.name.trim(),
        address: formatWalletAddress(wallet.address, wallet.network),
        owner_address: formatWalletAddress(wallet.owner_address, wallet.network),
        ...(normalized.source ? { source: normalized.source.trim() } : {}),
        ...(normalized.secret_file || !privateKey ? {} : { private_key: privateKey }),
    };
}

function normalizePendingRecord(
    value: PendingAgenticDeployment | PendingAgenticKeyRotation,
): PendingAgenticDeployment | PendingAgenticKeyRotation {
    const normalized = normalizeSecretBackedCollection(value);
    const privateKey =
        readPrivateKeyField(
            value as
                | (PendingAgenticDeployment & LegacyPrivateKeyCompatible)
                | (PendingAgenticKeyRotation & LegacyPrivateKeyCompatible),
        )?.trim() || undefined;

    if ('wallet_address' in normalized) {
        return {
            ...normalized,
            wallet_address: formatWalletAddress(normalized.wallet_address, normalized.network),
            owner_address: formatWalletAddress(normalized.owner_address, normalized.network),
            ...(normalized.secret_file || !privateKey ? {} : { private_key: privateKey }),
        };
    }

    return {
        ...normalized,
        ...(normalized.name ? { name: normalized.name.trim() } : {}),
        ...(normalized.source ? { source: normalized.source.trim() } : {}),
        ...(normalized.secret_file || !privateKey ? {} : { private_key: privateKey }),
    };
}

export function normalizeConfig(raw: TonConfig): TonConfig {
    return {
        version: CURRENT_TON_CONFIG_VERSION,
        active_wallet_id: raw.active_wallet_id ?? null,
        networks: {
            mainnet: toPublicNetwork(raw.networks?.mainnet, 'mainnet'),
            testnet: toPublicNetwork(raw.networks?.testnet, 'testnet'),
        },
        wallets: Array.isArray(raw.wallets) ? raw.wallets.map(normalizeStoredWallet) : [],
        pending_agentic_deployments: Array.isArray(raw.pending_agentic_deployments)
            ? raw.pending_agentic_deployments.map(
                  (deployment) => normalizePendingRecord(deployment) as PendingAgenticDeployment,
              )
            : [],
        pending_agentic_key_rotations: Array.isArray(raw.pending_agentic_key_rotations)
            ? raw.pending_agentic_key_rotations.map(
                  (rotation) => normalizePendingRecord(rotation) as PendingAgenticKeyRotation,
              )
            : [],
        agentic_setup_sessions: Array.isArray(raw.agentic_setup_sessions) ? raw.agentic_setup_sessions : [],
    };
}

export function createEmptyConfig(): TonConfig {
    return {
        version: CURRENT_TON_CONFIG_VERSION,
        active_wallet_id: null,
        networks: {},
        wallets: [],
        pending_agentic_deployments: [],
        pending_agentic_key_rotations: [],
        agentic_setup_sessions: [],
    };
}

export function getActiveWallet(config: TonConfig): StoredWallet | undefined {
    if (!config.active_wallet_id) {
        return undefined;
    }
    return config.wallets.find((wallet) => wallet.id === config.active_wallet_id && wallet.removed !== true);
}

export function findWallet(config: TonConfig, selector: string): StoredWallet | undefined {
    const normalized = selector.trim().toLowerCase();
    const normalizedRawAddress = normalizeAddressForComparison(selector);
    if (!normalized) {
        return undefined;
    }

    const exact = config.wallets.find((wallet) => {
        if (wallet.removed === true) {
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
            wallet.removed !== true &&
            (wallet.id.toLowerCase().startsWith(normalized) || wallet.address.toLowerCase().startsWith(normalized)),
    );
    return partial;
}

export function findWalletByAddress(config: TonConfig, network: TonNetwork, address: string): StoredWallet | undefined {
    const normalizedAddress = normalizeAddressForComparison(address);
    if (!normalizedAddress) {
        return undefined;
    }

    return config.wallets.find(
        (wallet) =>
            wallet.removed !== true &&
            wallet.network === network &&
            normalizeAddressForComparison(wallet.address)?.toLowerCase() === normalizedAddress.toLowerCase(),
    );
}

function touchWallet<T extends StoredWallet>(wallet: T): T {
    return {
        ...wallet,
        updated_at: nowIso(),
    };
}

export function upsertWallet(config: TonConfig, wallet: StoredWallet, options?: { setActive?: boolean }): TonConfig {
    const publicWallet = normalizeStoredWallet(wallet);
    const duplicate = findWalletByAddress(config, publicWallet.network, publicWallet.address);
    if (duplicate && duplicate.id !== wallet.id) {
        throw new ConfigError(
            `Wallet address ${publicWallet.address} is already configured as "${duplicate.name}" (${duplicate.id}) on ${publicWallet.network}.`,
        );
    }

    const existingIndex = config.wallets.findIndex((item) => item.id === publicWallet.id);
    const now = nowIso();
    const nextWallet = (
        existingIndex === -1
            ? { ...wallet, created_at: wallet.created_at || now, updated_at: wallet.updated_at || now }
            : {
                  ...config.wallets[existingIndex],
                  ...wallet,
                  created_at: config.wallets[existingIndex].created_at,
                  updated_at: now,
              }
    ) as StoredWallet;

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

export function removeWallet(
    config: TonConfig,
    selector: string,
): { config: TonConfig; removed: StoredWallet | undefined } {
    const wallet = findWallet(config, selector);
    if (!wallet) {
        return { config, removed: undefined };
    }

    const removedWallet = {
        ...wallet,
        removed: true,
        removed_at: nowIso(),
        updated_at: nowIso(),
    };
    const nextWallets = config.wallets.map((item) => (item.id === wallet.id ? removedWallet : item));
    const nextVisibleWallets = nextWallets.filter((item) => item.removed !== true);
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
): { config: TonConfig; wallet: StoredWallet | undefined } {
    const wallet = findWallet(config, selector);
    if (!wallet) {
        return { config, wallet: undefined };
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

function upsertTimestampedCollectionItem<T extends { id: string; created_at: string; updated_at: string }>(
    items: T[],
    item: T,
): T[] {
    const existingIndex = items.findIndex((existingItem) => existingItem.id === item.id);
    const now = nowIso();
    const existingItem = existingIndex === -1 ? null : items[existingIndex]!;
    const nextItem = !existingItem
        ? {
              ...item,
              created_at: item.created_at || now,
              updated_at: item.updated_at || now,
          }
        : {
              ...existingItem,
              ...item,
              created_at: existingItem.created_at,
              updated_at: now,
          };

    const nextItems = [...items];
    if (existingIndex === -1) {
        nextItems.push(nextItem);
    } else {
        nextItems[existingIndex] = nextItem;
    }

    return nextItems;
}

function matchesPendingDeployment(
    deployment: PendingAgenticDeployment,
    input: {
        id?: string;
        network?: TonNetwork;
        operatorPublicKey?: string;
    },
): boolean {
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
}

function matchesPendingKeyRotation(
    rotation: PendingAgenticKeyRotation,
    input: {
        id?: string;
        walletId?: string;
    },
): boolean {
    if (input.id && rotation.id !== input.id) {
        return false;
    }
    if (input.walletId && rotation.wallet_id !== input.walletId) {
        return false;
    }
    return true;
}

export function findPendingAgenticDeployment(
    config: TonConfig,
    input: {
        id?: string;
        network?: TonNetwork;
        operatorPublicKey?: string;
    },
): PendingAgenticDeployment | undefined {
    return config.pending_agentic_deployments.find((deployment) => matchesPendingDeployment(deployment, input));
}

export function upsertPendingAgenticDeployment(config: TonConfig, deployment: PendingAgenticDeployment): TonConfig {
    return {
        ...config,
        pending_agentic_deployments: upsertTimestampedCollectionItem(config.pending_agentic_deployments, deployment),
    };
}

export function findPendingAgenticKeyRotation(
    config: TonConfig,
    input: {
        id?: string;
        walletId?: string;
    },
): PendingAgenticKeyRotation | undefined {
    return config.pending_agentic_key_rotations.find((rotation) => matchesPendingKeyRotation(rotation, input));
}

export function upsertPendingAgenticKeyRotation(config: TonConfig, rotation: PendingAgenticKeyRotation): TonConfig {
    return {
        ...config,
        pending_agentic_key_rotations: upsertTimestampedCollectionItem(config.pending_agentic_key_rotations, rotation),
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
    return {
        ...config,
        pending_agentic_deployments: config.pending_agentic_deployments.filter((deployment) => {
            if (input.id && deployment.id === input.id) {
                return false;
            }

            return !(input.network && input.operatorPublicKey && matchesPendingDeployment(deployment, input));
        }),
    };
}

export function removePendingAgenticKeyRotation(
    config: TonConfig,
    input: {
        id?: string;
        walletId?: string;
    },
): TonConfig {
    return {
        ...config,
        pending_agentic_key_rotations: config.pending_agentic_key_rotations.filter(
            (rotation) => !matchesPendingKeyRotation(rotation, input),
        ),
    };
}

export function upsertAgenticSetupSession(config: TonConfig, session: StoredAgenticSetupSession): TonConfig {
    const existingIndex = config.agentic_setup_sessions.findIndex((item) => item.setup_id === session.setup_id);
    const nextSessions = [...config.agentic_setup_sessions];

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
    return {
        ...config,
        agentic_setup_sessions: config.agentic_setup_sessions.filter((session) => session.setup_id !== setupId),
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
    secretFile?: string;
    secretType?: SecretType;
    idPrefix?: string;
}): StoredStandardWallet {
    const now = nowIso();
    const id = createWalletId(input.idPrefix ?? input.name);
    return {
        id,
        name: input.name,
        type: 'standard',
        network: input.network,
        wallet_version: input.walletVersion,
        address: formatWalletAddress(input.address, input.network),
        ...(input.secretFile ? { secret_file: input.secretFile } : {}),
        ...(input.secretType ? { secret_type: input.secretType } : {}),
        created_at: now,
        updated_at: now,
    };
}

export function createAgenticWalletRecord(input: {
    name: string;
    network: TonNetwork;
    address: string;
    ownerAddress: string;
    secretFile?: string;
    operatorPublicKey?: string;
    source?: string;
    collectionAddress?: string;
    originOperatorPublicKey?: string;
    deployedByUser?: boolean;
    idPrefix?: string;
}): StoredAgenticWallet {
    const now = nowIso();
    const id = createWalletId(input.idPrefix ?? input.name);
    return {
        id,
        name: input.name,
        type: 'agentic',
        network: input.network,
        address: formatWalletAddress(input.address, input.network),
        owner_address: formatWalletAddress(input.ownerAddress, input.network),
        ...(input.secretFile ? { secret_file: input.secretFile } : {}),
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
    operatorPublicKey: string;
    name?: string;
    source?: string;
    collectionAddress?: string;
    idPrefix?: string;
}): PendingAgenticDeployment {
    const now = nowIso();
    const id = createWalletId(input.idPrefix ?? input.name ?? 'pending-agentic');
    return {
        id,
        network: input.network,
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
    operatorPublicKey: string;
    idPrefix?: string;
}): PendingAgenticKeyRotation {
    const now = nowIso();
    const id = createWalletId(input.idPrefix ?? 'pending-agentic-key-rotation');
    return {
        id,
        wallet_id: input.walletId,
        network: input.network,
        wallet_address: formatWalletAddress(input.walletAddress, input.network),
        owner_address: formatWalletAddress(input.ownerAddress, input.network),
        ...(input.collectionAddress
            ? { collection_address: formatAssetAddress(input.collectionAddress, input.network) }
            : {}),
        operator_public_key: input.operatorPublicKey,
        created_at: now,
        updated_at: now,
    };
}
