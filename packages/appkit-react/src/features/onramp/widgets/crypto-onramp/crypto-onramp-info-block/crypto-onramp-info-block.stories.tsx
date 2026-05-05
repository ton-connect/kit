/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CryptoOnrampInfoBlock } from './crypto-onramp-info-block';
import type { CryptoOnrampToken } from '../../../types';

const TON_TOKEN: CryptoOnrampToken = {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    address: '0x0000000000000000000000000000000000000000',
    logo: 'https://asset.ston.fi/img/EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv',
};

const meta: Meta<typeof CryptoOnrampInfoBlock> = {
    title: 'Public/Features/Onramp/Internal/CryptoOnrampInfoBlock',
    component: CryptoOnrampInfoBlock,
};

export default meta;
type Story = StoryObj<typeof CryptoOnrampInfoBlock>;

export const Default: Story = {
    args: {
        selectedToken: TON_TOKEN,
        tokenAmount: '12.345678',
        isLoadingQuote: false,
        isWalletConnected: true,
        targetBalance: '100.5',
        isLoadingTargetBalance: false,
        quoteProviderName: 'Layerswap',
    },
};

export const WalletDisconnected: Story = {
    args: {
        selectedToken: TON_TOKEN,
        tokenAmount: '12.345678',
        isLoadingQuote: false,
        isWalletConnected: false,
        targetBalance: '',
        isLoadingTargetBalance: false,
        quoteProviderName: 'Layerswap',
    },
};

export const Loading: Story = {
    args: {
        selectedToken: TON_TOKEN,
        tokenAmount: '0',
        isLoadingQuote: true,
        isWalletConnected: true,
        targetBalance: '0',
        isLoadingTargetBalance: true,
        quoteProviderName: null,
    },
};
