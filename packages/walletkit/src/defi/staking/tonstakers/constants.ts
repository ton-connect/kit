/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network, UnstakeMode } from '../../../api/models';
import type { UserFriendlyAddress, StakingProviderMetadata } from '../../../api/models';
import { parseUnits } from '../../../utils/units';

export const CACHE_TIMEOUT = 30000;

export const DEFAULT_METADATA: Record<string, StakingProviderMetadata> = {
    [Network.mainnet().chainId]: {
        name: 'Tonstakers',
        stakeToken: { ticker: 'TON', decimals: 9, address: 'ton' },
        receiveToken: {
            ticker: 'tsTON',
            decimals: 9,
            address: 'EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav' as UserFriendlyAddress,
        },
        contractAddress: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR' as UserFriendlyAddress,
        supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END],
        supportsReversedQuote: true,
    },
    [Network.testnet().chainId]: {
        name: 'Tonstakers',
        stakeToken: { ticker: 'TON', decimals: 9, address: 'ton' },
        receiveToken: {
            ticker: 'TUNA',
            decimals: 9,
            address: 'kQAiQ2XK7BXePLwemeo-u4wNyjg-wxGeySmaFGEP7R2Mhf4m' as UserFriendlyAddress,
        },
        contractAddress: 'kQANFsYyYn-GSZ4oajUJmboDURZU-udMHf9JxzO4vYM_hFP3' as UserFriendlyAddress,
        supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END],
        supportsReversedQuote: true,
    },
};

// Contract-related constants
export const CONTRACT = {
    PARTNER_CODE: 0x000000106796caef,
    PAYLOAD_UNSTAKE: 0x595f07bc,
    PAYLOAD_STAKE: 0x47d54391,
    STAKE_FEE_RES: parseUnits('1', 9),
    UNSTAKE_FEE_RES: parseUnits('1.05', 9),
};
