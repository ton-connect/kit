/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnstakeMode } from '@ton/appkit';

import { StakingBalanceBlock } from './staking-balance-block';

const meta: Meta<typeof StakingBalanceBlock> = {
    title: 'Public/Features/Staking/Internal/StakingBalanceBlock',
    component: StakingBalanceBlock,
};

export default meta;
type Story = StoryObj<typeof StakingBalanceBlock>;

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

export const Stake: Story = {
    args: {
        direction: 'stake',
        providerMetadata: mockMetadata,
        balance: '10000000000', // 10 TON
        isBalanceLoading: false,
    },
};

export const Unstake: Story = {
    args: {
        direction: 'unstake',
        providerMetadata: mockMetadata,
        stakedBalance: '5000000000', // 5 tsTON
        isStakedBalanceLoading: false,
    },
};

export const Loading: Story = {
    args: {
        direction: 'stake',
        providerMetadata: mockMetadata,
        isBalanceLoading: true,
    },
};
