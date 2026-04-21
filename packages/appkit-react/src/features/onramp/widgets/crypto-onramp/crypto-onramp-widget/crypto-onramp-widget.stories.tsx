/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CryptoOnrampToken, CryptoPaymentMethod } from '../../../types';
import { CryptoOnrampWidget } from './crypto-onramp-widget';

const TOKENS: CryptoOnrampToken[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: '0x0000000000000000000000000000000000000000',
        logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
    },
    {
        id: 'usdt-ton',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
];

const PAYMENT_METHODS: CryptoPaymentMethod[] = [
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
];

const meta: Meta<typeof CryptoOnrampWidget> = {
    title: 'Public/Features/Onramp/CryptoOnrampWidget',
    component: CryptoOnrampWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CryptoOnrampWidget>;

export const Default: Story = {
    args: {
        tokens: TOKENS,
        defaultTokenId: 'usdt-ton',
        paymentMethods: PAYMENT_METHODS,
        defaultMethodId: 'usdc-base',
    },
};

export const WithSections: Story = {
    args: {
        tokens: TOKENS,
        defaultTokenId: 'ton',
        tokenSections: [{ title: 'Popular', ids: ['ton', 'usdt-ton'] }],
        paymentMethods: PAYMENT_METHODS,
        defaultMethodId: 'usdc-base',
        methodSections: [{ title: 'EVM Networks', ids: ['usdc-base', 'usdt-bsc'] }],
    },
};
