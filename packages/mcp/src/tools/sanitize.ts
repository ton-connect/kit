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
    StoredWallet,
} from '../registry/config.js';
import {
    omitInlineSecretFields,
    omitSecretRefFields,
    readSecretMaterial,
    hasSecretFile,
} from '../registry/private-key-files.js';
import type { AgenticRootWalletSetupStatus } from '../services/AgenticOnboardingService.js';

interface PublicNetworkConfig {
    has_toncenter_api_key: boolean;
    agentic_collection_address?: string;
}

export function sanitizePrivateKeyBackedValue(
    value: StoredAgenticWallet | PendingAgenticDeployment | PendingAgenticKeyRotation,
) {
    return {
        ...(omitSecretRefFields(omitInlineSecretFields(value)) as Omit<typeof value, 'sign_method' | 'secret_type'>),
        has_private_key: hasSecretFile(value),
    };
}

export function sanitizeStoredWallet(wallet: StoredWallet | null | undefined) {
    if (!wallet) {
        return null;
    }

    if (wallet.type === 'standard') {
        const secret = readSecretMaterial(wallet);
        return {
            ...(omitSecretRefFields(omitInlineSecretFields(wallet)) as Omit<
                typeof wallet,
                'sign_method' | 'secret_type'
            >),
            has_mnemonic: secret?.type === 'mnemonic',
            has_private_key: secret?.type === 'private_key',
        };
    }

    return sanitizePrivateKeyBackedValue(wallet);
}

export function sanitizeNetworkConfig(config: ConfigNetwork): PublicNetworkConfig {
    return {
        has_toncenter_api_key: Boolean(config.toncenter_api_key),
        ...(config.agentic_collection_address ? { agentic_collection_address: config.agentic_collection_address } : {}),
    };
}

export function sanitizeAgenticRootWalletSetupStatus(setup: AgenticRootWalletSetupStatus | null | undefined) {
    if (!setup) {
        return null;
    }

    return {
        ...setup,
        session: setup.session ?? null,
        pendingDeployment: sanitizePrivateKeyBackedValue(setup.pendingDeployment),
    };
}
