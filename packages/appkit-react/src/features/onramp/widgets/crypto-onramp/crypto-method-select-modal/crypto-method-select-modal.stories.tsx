/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CryptoPaymentMethod } from '../../../types';
import type { ChainInfo } from '../utils/chains';
import { CryptoMethodSelectModal } from './crypto-method-select-modal';

const CHAINS: Record<string, ChainInfo> = {
    'eip155:1': {
        name: 'Ethereum',
        logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    },
    'eip155:56': {
        name: 'BSC',
        logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    },
    'eip155:8453': {
        name: 'Base',
        logo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    },
};

const METHODS: CryptoPaymentMethod[] = [
    {
        id: 'usdc-base',
        symbol: 'USDC',
        name: 'USD Coin',
        chain: 'eip155:8453',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        logo: 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602',
    },
    {
        id: 'usdt-bsc',
        symbol: 'USDT',
        name: 'Tether',
        chain: 'eip155:56',
        decimals: 18,
        address: '0x55d398326f99059fF775485246999027B3197955',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
    {
        id: 'eth-mainnet',
        symbol: 'ETH',
        name: 'Ethereum',
        chain: 'eip155:1',
        decimals: 18,
        address: '',
        logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    },
];

const meta: Meta<typeof CryptoMethodSelectModal> = {
    title: 'Features/Onramp/Internal/CryptoMethodSelectModal',
    component: CryptoMethodSelectModal,
};

export default meta;
type Story = StoryObj<typeof CryptoMethodSelectModal>;

export const Default: Story = {
    args: {
        open: true,
        methods: METHODS,
        chains: CHAINS,
        onClose: () => {},
        onSelect: () => {},
    },
};

export const WithSections: Story = {
    args: {
        open: true,
        methods: METHODS,
        methodSections: [{ title: 'Stablecoins', ids: ['usdc-base', 'usdt-bsc'] }],
        chains: CHAINS,
        onClose: () => {},
        onSelect: () => {},
    },
};

export const Empty: Story = {
    args: {
        open: true,
        methods: [],
        onClose: () => {},
        onSelect: () => {},
    },
};
