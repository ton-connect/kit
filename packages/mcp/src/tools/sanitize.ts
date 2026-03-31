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
        const result: PublicStandardWallet = {
            id: wallet.id,
            name: wallet.name,
            type: wallet.type,
            network: wallet.network,
            address: wallet.address,
            wallet_version: wallet.wallet_version,
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
            has_mnemonic: Boolean(wallet.mnemonic),
            has_private_key: Boolean(wallet.private_key),
        };
        if (wallet.removed != null) result.removed = wallet.removed;
        if (wallet.removed_at != null) result.removed_at = wallet.removed_at;
        return result;
    }

    const result: PublicAgenticWallet = {
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        network: wallet.network,
        address: wallet.address,
        owner_address: wallet.owner_address,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at,
        has_operator_private_key: Boolean(wallet.operator_private_key),
    };
    if (wallet.operator_public_key != null) result.operator_public_key = wallet.operator_public_key;
    if (wallet.source != null) result.source = wallet.source;
    if (wallet.collection_address != null) result.collection_address = wallet.collection_address;
    if (wallet.origin_operator_public_key != null)
        result.origin_operator_public_key = wallet.origin_operator_public_key;
    if (wallet.deployed_by_user != null) result.deployed_by_user = wallet.deployed_by_user;
    if (wallet.removed != null) result.removed = wallet.removed;
    if (wallet.removed_at != null) result.removed_at = wallet.removed_at;
    return result;
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
    const result: PublicPendingAgenticDeployment = {
        id: deployment.id,
        network: deployment.network,
        operator_public_key: deployment.operator_public_key,
        created_at: deployment.created_at,
        updated_at: deployment.updated_at,
        has_operator_private_key: Boolean(deployment.operator_private_key),
    };
    if (deployment.name != null) result.name = deployment.name;
    if (deployment.source != null) result.source = deployment.source;
    if (deployment.collection_address != null) result.collection_address = deployment.collection_address;
    return result;
}

export function sanitizePendingAgenticDeployments(
    deployments: PendingAgenticDeployment[],
): PublicPendingAgenticDeployment[] {
    return deployments.map((deployment) => sanitizePendingAgenticDeployment(deployment));
}

export function sanitizePendingAgenticKeyRotation(
    rotation: PendingAgenticKeyRotation,
): PublicPendingAgenticKeyRotation {
    const result: PublicPendingAgenticKeyRotation = {
        id: rotation.id,
        wallet_id: rotation.wallet_id,
        network: rotation.network,
        wallet_address: rotation.wallet_address,
        owner_address: rotation.owner_address,
        operator_public_key: rotation.operator_public_key,
        created_at: rotation.created_at,
        updated_at: rotation.updated_at,
        has_operator_private_key: Boolean(rotation.operator_private_key),
    };
    if (rotation.collection_address != null) result.collection_address = rotation.collection_address;
    return result;
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
        setupId: setup.setupId,
        pendingDeployment: sanitizePendingAgenticDeployment(setup.pendingDeployment),
        session: setup.session,
        status: setup.status,
        ...(setup.dashboardUrl != null ? { dashboardUrl: setup.dashboardUrl } : {}),
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
