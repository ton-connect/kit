/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import type {
    SignMethod,
    PendingAgenticDeployment,
    PendingAgenticKeyRotation,
    SecretType,
    StoredAgenticWallet,
    StoredStandardWallet,
    StoredWallet,
    TonConfig,
} from './config.js';
import { chmodIfExists, getConfigDir } from './config-path.js';
import { LEGACY_AGENTIC_PRIVATE_KEY_FIELD, readPrivateKeyField } from './private-key-field.js';
import type { LegacyPrivateKeyCompatible } from './private-key-field.js';
import { readFileSync, writeFileSync } from './protected-file.js';

export type SecretReadableValue = {
    sign_method?: SignMethod;
    secret_type?: SecretType;
} & LegacyPrivateKeyCompatible & {
        mnemonic?: string;
    };
export type StandardSecretInput = StoredStandardWallet & SecretReadableValue;
export interface SecretMaterializationInput {
    wallets?: Record<string, { mnemonic?: string; private_key?: string }>;
    pendingAgenticDeployments?: Record<string, string>;
    pendingAgenticKeyRotations?: Record<string, string>;
}
type InlineSecretMaterial = { type: SecretType; value: string };

const PRIVATE_KEYS_DIR = 'private-keys';

function trimSecret(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

function resolvePrivateKeyPath(filePath: string): string {
    return isAbsolute(filePath) ? filePath : resolve(getConfigDir(), filePath);
}

function getLocalFilePath(signMethod: SignMethod | undefined): string | undefined {
    if (!signMethod || signMethod.type !== 'local_file') {
        return undefined;
    }

    return trimSecret(signMethod.file_path);
}

function persistSecretFile(
    filePath: string | undefined,
    value: string | undefined,
    pathParts: string[],
): string | undefined {
    const normalizedValue = trimSecret(value);
    if (!normalizedValue) {
        return trimSecret(filePath);
    }

    const providedPath = filePath?.trim();
    const targetPath = providedPath
        ? resolvePrivateKeyPath(providedPath)
        : join(getConfigDir(), PRIVATE_KEYS_DIR, ...pathParts);
    mkdirSync(dirname(targetPath), { recursive: true, mode: 0o700 });
    chmodIfExists(dirname(targetPath), 0o700);
    writeFileSync(targetPath, normalizedValue + '\n', {
        mode: 0o600,
    });
    chmodIfExists(targetPath, 0o600);
    return providedPath || relative(getConfigDir(), targetPath);
}

function readSecretFile(filePath: string | undefined): string | undefined {
    const normalizedPath = filePath?.trim();
    if (!normalizedPath) {
        return undefined;
    }

    const resolvedPath = resolvePrivateKeyPath(normalizedPath);
    if (!existsSync(resolvedPath)) {
        return undefined;
    }

    return trimSecret(readFileSync(resolvedPath));
}

export function omitSecretRefFields<T extends { sign_method?: SignMethod; secret_type?: SecretType }>(
    value: T,
): Omit<T, 'sign_method' | 'secret_type'> {
    const { sign_method: _signMethod, secret_type: _secretType, ...rest } = value;
    return rest as Omit<T, 'sign_method' | 'secret_type'>;
}

export function omitInlineSecretFields<T extends object>(
    value: T &
        LegacyPrivateKeyCompatible & {
            mnemonic?: string;
        },
): Omit<T, 'mnemonic' | 'private_key' | typeof LEGACY_AGENTIC_PRIVATE_KEY_FIELD> {
    const {
        mnemonic: _mnemonic,
        private_key: _privateKey,
        [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: _legacyPrivateKey,
        ...rest
    } = value;

    return rest as Omit<T, 'mnemonic' | 'private_key' | typeof LEGACY_AGENTIC_PRIVATE_KEY_FIELD>;
}

function readInlineSecret(value: SecretReadableValue): InlineSecretMaterial | undefined {
    const mnemonic = trimSecret(value.mnemonic);
    if (mnemonic) {
        return { type: 'mnemonic', value: mnemonic };
    }

    const privateKey = trimSecret(readPrivateKeyField(value));
    if (privateKey) {
        return { type: 'private_key', value: privateKey };
    }

    return undefined;
}

function persistPrivateKeyRecord(
    value:
        | (StoredAgenticWallet & LegacyPrivateKeyCompatible)
        | (PendingAgenticDeployment & LegacyPrivateKeyCompatible)
        | (PendingAgenticKeyRotation & LegacyPrivateKeyCompatible),
    pathParts: string[],
): StoredAgenticWallet | PendingAgenticDeployment | PendingAgenticKeyRotation {
    const {
        private_key: _privateKey,
        secret_type: _secretType,
        sign_method: _signMethod,
        ...publicValue
    } = value as typeof value & {
        sign_method?: SignMethod;
        secret_type?: SecretType;
    };
    const secretFile = persistSecretFile(getLocalFilePath(value.sign_method), value.private_key, pathParts);
    const signMethod: SignMethod | undefined = secretFile ? {
        type: 'local_file',
        file_path: secretFile
    } : undefined;
    return {
        ...publicValue,
        ...(signMethod ? { sign_method: signMethod } : {}),
    };
}

export function persistStandardSecretRef(wallet: StandardSecretInput): StoredStandardWallet {
    const { mnemonic: _mnemonic, private_key: _privateKey, sign_method: _signMethod, ...publicWallet } = wallet;
    const secretType = wallet.mnemonic ? 'mnemonic' : wallet.private_key ? 'private_key' : wallet.secret_type;
    const secretFile = wallet.mnemonic
        ? persistSecretFile(getLocalFilePath(wallet.sign_method), wallet.mnemonic, ['wallets', `${wallet.id}.mnemonic`])
        : wallet.private_key
          ? persistSecretFile(getLocalFilePath(wallet.sign_method), wallet.private_key, ['wallets', `${wallet.id}.private-key`])
          : wallet.sign_method?.file_path;
    const signMethod: SignMethod | undefined = secretFile ? {
        type: 'local_file',
        file_path: secretFile
    } : undefined;
    return {
        ...publicWallet,
        ...(signMethod ? { sign_method: signMethod } : {}),
        ...(secretType ? { secret_type: secretType } : {}),
    };
}

function materializePrivateKeyRecord(
    value:
        | (StoredAgenticWallet & LegacyPrivateKeyCompatible)
        | (PendingAgenticDeployment & LegacyPrivateKeyCompatible)
        | (PendingAgenticKeyRotation & LegacyPrivateKeyCompatible),
    pathParts: string[],
    overridePrivateKey?: string,
): StoredAgenticWallet | PendingAgenticDeployment | PendingAgenticKeyRotation {
    const inlineSecret = readInlineSecret(value);
    const privateKey =
        trimSecret(overridePrivateKey) ?? (inlineSecret?.type === 'private_key' ? inlineSecret.value : undefined);
    return persistPrivateKeyRecord(
        {
            ...value,
            ...(privateKey ? { private_key: privateKey } : {}),
        },
        pathParts,
    );
}

function materializeStandardWallet(
    wallet: StandardSecretInput,
    overrides?: { mnemonic?: string; private_key?: string },
): StoredStandardWallet {
    const inlineSecret = readInlineSecret(wallet);
    const mnemonic =
        trimSecret(overrides?.mnemonic) ?? (inlineSecret?.type === 'mnemonic' ? inlineSecret.value : undefined);
    const privateKey =
        trimSecret(overrides?.private_key) ?? (inlineSecret?.type === 'private_key' ? inlineSecret.value : undefined);
    return persistStandardSecretRef({
        ...wallet,
        ...(mnemonic ? { mnemonic } : {}),
        ...(privateKey ? { private_key: privateKey } : {}),
    });
}

function materializeStoredWallet(
    wallet: StoredWallet,
    overrides?: { mnemonic?: string; private_key?: string },
): StoredWallet {
    if (wallet.removed) {
        return omitSecretRefFields(wallet) as StoredWallet;
    }

    if (wallet.type === 'standard') {
        return materializeStandardWallet(wallet, overrides);
    }

    return materializePrivateKeyRecord(
        wallet as StoredAgenticWallet & LegacyPrivateKeyCompatible,
        ['wallets', `${wallet.id}.private-key`],
        overrides?.private_key,
    ) as StoredWallet;
}

function materializePrivateKeyCollection<
    T extends
        | (StoredAgenticWallet & LegacyPrivateKeyCompatible)
        | (PendingAgenticDeployment & LegacyPrivateKeyCompatible)
        | (PendingAgenticKeyRotation & LegacyPrivateKeyCompatible),
>(values: T[], overrides: Record<string, string>, pathSegments: string[]): T[] {
    return values.map(
        (value) =>
            materializePrivateKeyRecord(value, [...pathSegments, `${value.id}.private-key`], overrides[value.id]) as T,
    );
}

export function materializeSecrets(config: TonConfig, secretInputs: SecretMaterializationInput = {}): TonConfig {
    const walletSecrets = secretInputs.wallets ?? {};
    const pendingDeploymentSecrets = secretInputs.pendingAgenticDeployments ?? {};
    const pendingRotationSecrets = secretInputs.pendingAgenticKeyRotations ?? {};

    return {
        ...config,
        wallets: config.wallets.map((wallet) => materializeStoredWallet(wallet, walletSecrets[wallet.id])),
        pending_agentic_deployments: materializePrivateKeyCollection(
            config.pending_agentic_deployments as Array<PendingAgenticDeployment & LegacyPrivateKeyCompatible>,
            pendingDeploymentSecrets,
            ['pending-agentic-deployments'],
        ),
        pending_agentic_key_rotations: materializePrivateKeyCollection(
            config.pending_agentic_key_rotations as Array<PendingAgenticKeyRotation & LegacyPrivateKeyCompatible>,
            pendingRotationSecrets,
            ['pending-agentic-key-rotations'],
        ),
    };
}

export function readSecretMaterial(value: SecretReadableValue): InlineSecretMaterial | undefined {
    const fileSecret = readSecretFile(getLocalFilePath(value.sign_method));
    if (fileSecret) {
        return {
            type: value.secret_type ?? 'private_key',
            value: fileSecret,
        };
    }

    return readInlineSecret(value);
}

export function readSecret(value: SecretReadableValue): string | undefined {
    return readSecretMaterial(value)?.value;
}

function deleteSecretFile(filePath: string | undefined): void {
    const normalizedPath = filePath?.trim();
    if (!normalizedPath) {
        return;
    }

    try {
        const resolvedPath = resolvePrivateKeyPath(normalizedPath);
        if (existsSync(resolvedPath)) {
            unlinkSync(resolvedPath);
        }
    } catch {
        // Best-effort only.
    }
}

function migrateLegacyPrivateKeyField<T extends LegacyPrivateKeyCompatible>(
    value: T,
): {
    value: T;
    changed: boolean;
} {
    const legacyPrivateKey = value[LEGACY_AGENTIC_PRIVATE_KEY_FIELD];
    if (!legacyPrivateKey) {
        return { value, changed: false };
    }

    const { [LEGACY_AGENTIC_PRIVATE_KEY_FIELD]: _legacyPrivateKey, ...rest } = value;
    return {
        changed: true,
        value: {
            ...rest,
            private_key: value.private_key ?? legacyPrivateKey,
        } as T,
    };
}

function migrateLegacyPrivateKeyCollection<T extends { sign_method?: SignMethod } & LegacyPrivateKeyCompatible>(
    values: T[] | undefined,
): {
    values: T[];
    changed: boolean;
} {
    let changed = false;
    const migratedValues = (values ?? []).map((value) => {
        const migrated = migrateLegacyPrivateKeyField(value);
        const privateKey = trimSecret(readPrivateKeyField(migrated.value));
        if (migrated.changed || privateKey) {
            changed = true;
        }
        return {
            ...(omitInlineSecretFields(migrated.value) as T),
            ...(privateKey ? { private_key: privateKey } : {}),
        } as T;
    });

    return {
        values: migratedValues,
        changed,
    };
}

export function migrateFromV2Config(rawConfig: TonConfig): { config: TonConfig; changed: boolean } {
    let changed = false;

    const wallets = rawConfig.wallets.map((wallet) => {
        if (wallet.type === 'standard') {
            const candidate = wallet as StandardSecretInput;
            const mnemonic = trimSecret(candidate.mnemonic);
            const privateKey = trimSecret(candidate.private_key);
            if (!candidate.sign_method && (mnemonic || privateKey)) {
                changed = true;
            }
            return {
                ...(omitInlineSecretFields(wallet) as StoredStandardWallet),
                ...(candidate.sign_method ? {} : mnemonic ? { mnemonic, secret_type: 'mnemonic' as const } : {}),
                ...(candidate.sign_method || mnemonic || !privateKey
                    ? {}
                    : { private_key: privateKey, secret_type: 'private_key' as const }),
            } as StoredWallet;
        }

        const { values, changed: agenticChanged } = migrateLegacyPrivateKeyCollection([
            wallet as StoredAgenticWallet & LegacyPrivateKeyCompatible,
        ]);
        changed ||= agenticChanged;
        return values![0] as StoredWallet;
    });

    const { values: pendingDeployments, changed: deploymentsChanged } = migrateLegacyPrivateKeyCollection(
        rawConfig.pending_agentic_deployments as
            | Array<PendingAgenticDeployment & LegacyPrivateKeyCompatible>
            | undefined,
    );
    const { values: pendingRotations, changed: rotationsChanged } = migrateLegacyPrivateKeyCollection(
        rawConfig.pending_agentic_key_rotations as
            | Array<PendingAgenticKeyRotation & LegacyPrivateKeyCompatible>
            | undefined,
    );
    changed ||= deploymentsChanged || rotationsChanged;

    return {
        changed,
        config: {
            ...rawConfig,
            wallets,
            pending_agentic_deployments: pendingDeployments,
            pending_agentic_key_rotations: pendingRotations,
        },
    };
}

export function collectSecretFiles(config: TonConfig | null | undefined): Set<string> {
    if (!config) {
        return new Set();
    }

    return new Set(
        [
            ...config.wallets.map((wallet) => getLocalFilePath(wallet.sign_method)),
            ...(config.pending_agentic_deployments ?? []).map((deployment) => getLocalFilePath(deployment.sign_method)),
            ...(config.pending_agentic_key_rotations ?? []).map((rotation) => getLocalFilePath(rotation.sign_method)),
        ].filter((filePath): filePath is string => Boolean(filePath?.trim())),
    );
}

export function cleanupOrphanSecretFiles(
    before: TonConfig | null | undefined,
    after: TonConfig | null | undefined,
): void {
    const nextFiles = collectSecretFiles(after);
    for (const filePath of collectSecretFiles(before)) {
        if (!nextFiles.has(filePath)) {
            deleteSecretFile(filePath);
        }
    }
}

export function deleteAllSecretFiles(config: TonConfig | null | undefined): void {
    for (const filePath of collectSecretFiles(config)) {
        deleteSecretFile(filePath);
    }
}
