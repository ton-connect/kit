/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnstakeMode, Network } from '@ton/appkit';

import { StakingInfo } from './staking-info';

const meta: Meta<typeof StakingInfo> = {
    title: 'Features/Staking/Internal/StakingInfo',
    component: StakingInfo,
};

export default meta;
type Story = StoryObj<typeof StakingInfo>;

const mockMetadata = {
    providerId: 'tonstakers',
    name: 'Tonstakers',
    description: 'Staking provider',
    image: 'https://asset.ston.fi/img/EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav/38f530facb209e4696b8aef17af51df94d16bd879926c517b07d25841da287b7',
    stakeToken: {
        symbol: 'TON',
        ticker: 'TON',
        decimals: 9,
        address: 'ton',
    },
    receiveToken: {
        symbol: 'tsTON',
        ticker: 'tsTON',
        decimals: 9,
        address: 'UQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAMtq',
    },
    supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.ROUND_END],
    supportsReversedQuote: false,
};

const mockProviderInfo = {
    apy: 4.5,
    exchangeRate: '1.05',
    instantUnstakeAvailable: '10000000000',
};

const mockQuote = {
    amountIn: '1000000000',
    amountOut: '950000000',
    rawAmountIn: '1000000000',
    rawAmountOut: '950000000',
    providerId: 'tonstakers',
    direction: 'stake' as const,
    network: Network.mainnet(),
};

export const Default: Story = {
    args: {
        quote: mockQuote,
        isQuoteLoading: false,
        providerInfo: mockProviderInfo,
        providerMetadata: mockMetadata,
        isProviderInfoLoading: false,
        direction: 'stake',
    },
};

export const Unstake: Story = {
    args: {
        ...Default.args,
        direction: 'unstake',
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        isQuoteLoading: true,
        isProviderInfoLoading: true,
    },
};
