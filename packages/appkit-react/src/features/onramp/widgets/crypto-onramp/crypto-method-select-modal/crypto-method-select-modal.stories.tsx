/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CryptoPaymentMethod } from '../../../types';
import { CryptoMethodSelectModal } from './crypto-method-select-modal';

const METHODS: CryptoPaymentMethod[] = [
    {
        id: 'usdc-base',
        symbol: 'USDC',
        name: 'USD Coin',
        network: 'Base',
        networkId: '8453',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        logo: 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602',
        networkLogo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    },
    {
        id: 'usdt-bsc',
        symbol: 'USDT',
        name: 'Tether',
        network: 'BSC',
        networkId: '56',
        decimals: 18,
        address: '0x55d398326f99059fF775485246999027B3197955',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
        networkLogo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    },
    {
        id: 'eth-mainnet',
        symbol: 'ETH',
        name: 'Ethereum',
        network: 'Ethereum',
        networkId: '1',
        decimals: 18,
        address: '',
        logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
        networkLogo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    },
];

const meta: Meta<typeof CryptoMethodSelectModal> = {
    title: 'Public/Features/Onramp/Internal/CryptoMethodSelectModal',
    component: CryptoMethodSelectModal,
};

export default meta;
type Story = StoryObj<typeof CryptoMethodSelectModal>;

export const Default: Story = {
    args: {
        open: true,
        methods: METHODS,
        onClose: () => {},
        onSelect: () => {},
    },
};

export const WithSections: Story = {
    args: {
        open: true,
        methods: METHODS,
        methodSections: [{ title: 'Stablecoins', ids: ['usdc-base', 'usdt-bsc'] }],
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
