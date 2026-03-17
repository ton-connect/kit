/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ConfigNetwork,
    PendingAgenticDeployment,
    PendingAgenticKeyRotation,
    StoredAgenticWallet,
    StoredStandardWallet,
    StoredWallet,
} from '../registry/config.js';
import type { AgenticRootWalletSetupStatus } from '../services/AgenticOnboardingService.js';

export type PublicStandardWallet = Omit<StoredStandardWallet, 'mnemonic' | 'private_key'> & {
    has_mnemonic: boolean;
    has_private_key: boolean;
};
export type PublicAgenticWallet = Omit<StoredAgenticWallet, 'operator_private_key'> & {
    has_operator_private_key: boolean;
};
export type PublicStoredWallet = PublicStandardWallet | PublicAgenticWallet;

export interface PublicNetworkConfig {
    has_toncenter_api_key: boolean;
    agentic_collection_address?: string;
}

export type PublicPendingAgenticDeployment = Omit<PendingAgenticDeployment, 'operator_private_key'> & {
    has_operator_private_key: boolean;
};
export type PublicPendingAgenticKeyRotation = Omit<PendingAgenticKeyRotation, 'operator_private_key'> & {
    has_operator_private_key: boolean;
};

export interface PublicAgenticRootWalletSetupStatus extends Omit<AgenticRootWalletSetupStatus, 'pendingDeployment'> {
    pendingDeployment: PublicPendingAgenticDeployment;
}

export function sanitizeStoredWallet(wallet: StoredWallet | null): PublicStoredWallet | null {
    if (!wallet) {
        return null;
    }

    if (wallet.type === 'standard') {
        const { mnemonic: _mnemonic, private_key: _privateKey, ...publicWallet } = wallet;
        return {
            ...publicWallet,
            has_mnemonic: Boolean(wallet.mnemonic),
            has_private_key: Boolean(wallet.private_key),
        };
    }

    const { operator_private_key: _operatorPrivateKey, ...publicWallet } = wallet;
    return {
        ...publicWallet,
        has_operator_private_key: Boolean(wallet.operator_private_key),
    };
}

export function sanitizeStoredWallets(wallets: StoredWallet[]): PublicStoredWallet[] {
    return wallets
        .map((wallet) => sanitizeStoredWallet(wallet))
        .filter((wallet): wallet is PublicStoredWallet => wallet !== null);
}

export const sanitizeWallet = sanitizeStoredWallet;
export const sanitizeWallets = sanitizeStoredWallets;

export function sanitizeNetworkConfig(config: ConfigNetwork): PublicNetworkConfig {
    return {
        has_toncenter_api_key: Boolean(config.toncenter_api_key),
        ...(config.agentic_collection_address ? { agentic_collection_address: config.agentic_collection_address } : {}),
    };
}

export function sanitizePendingAgenticDeployment(deployment: PendingAgenticDeployment): PublicPendingAgenticDeployment {
    const { operator_private_key: _operatorPrivateKey, ...publicDeployment } = deployment;
    return {
        ...publicDeployment,
        has_operator_private_key: Boolean(deployment.operator_private_key),
    };
}

export function sanitizePendingAgenticDeployments(
    deployments: PendingAgenticDeployment[],
): PublicPendingAgenticDeployment[] {
    return deployments.map((deployment) => sanitizePendingAgenticDeployment(deployment));
}

export function sanitizePendingAgenticKeyRotation(
    rotation: PendingAgenticKeyRotation,
): PublicPendingAgenticKeyRotation {
    const { operator_private_key: _operatorPrivateKey, ...publicRotation } = rotation;
    return {
        ...publicRotation,
        has_operator_private_key: Boolean(rotation.operator_private_key),
    };
}

export function sanitizePendingAgenticKeyRotations(
    rotations: PendingAgenticKeyRotation[],
): PublicPendingAgenticKeyRotation[] {
    return rotations.map((rotation) => sanitizePendingAgenticKeyRotation(rotation));
}

export function sanitizeAgenticRootWalletSetupStatus(
    setup: AgenticRootWalletSetupStatus | null,
): PublicAgenticRootWalletSetupStatus | null {
    if (!setup) {
        return null;
    }

    return {
        ...setup,
        pendingDeployment: sanitizePendingAgenticDeployment(setup.pendingDeployment),
    };
}

export function sanitizeAgenticRootWalletSetupStatuses(
    setups: AgenticRootWalletSetupStatus[],
): PublicAgenticRootWalletSetupStatus[] {
    return setups
        .map((setup) => sanitizeAgenticRootWalletSetupStatus(setup))
        .filter(Boolean) as PublicAgenticRootWalletSetupStatus[];
}

export const sanitizeRootWalletSetup = sanitizeAgenticRootWalletSetupStatus;
export const sanitizeRootWalletSetups = sanitizeAgenticRootWalletSetupStatuses;
