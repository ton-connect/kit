/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CryptoOnrampDepositModal } from './crypto-onramp-deposit-modal';

const ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TOKEN_LOGO = 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602';

const meta: Meta<typeof CryptoOnrampDepositModal> = {
    title: 'Public/Features/Onramp/Internal/CryptoOnrampDepositModal',
    component: CryptoOnrampDepositModal,
};

export default meta;
type Story = StoryObj<typeof CryptoOnrampDepositModal>;

export const Default: Story = {
    args: {
        open: true,
        address: ADDRESS,
        amount: '100',
        symbol: 'USDC',
        tokenLogo: TOKEN_LOGO,
        depositStatus: null,
        targetSymbol: 'USDT',
        targetBalance: '12.34',
        targetDecimals: 6,
        onClose: () => {},
    },
};

export const WithMemo: Story = {
    args: {
        ...Default.args,
        memo: '12345678',
    },
};

export const WithNetworkWarning: Story = {
    args: {
        ...Default.args,
        networkWarning: 'This address only accepts USDC on the Base network. Sending other assets will result in loss.',
    },
};

export const Pending: Story = {
    args: {
        ...Default.args,
        depositStatus: 'pending',
    },
};

export const Success: Story = {
    args: {
        ...Default.args,
        depositStatus: 'success',
    },
};

export const Failed: Story = {
    args: {
        ...Default.args,
        depositStatus: 'failed',
    },
};

export const LoadingTargetBalance: Story = {
    args: {
        ...Default.args,
        targetBalance: undefined,
        isLoadingTargetBalance: true,
    },
};
