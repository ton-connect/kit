/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { LogoWithNetwork } from './logo-with-network';

const meta: Meta<typeof LogoWithNetwork> = {
    title: 'Private/Components/LogoWithNetwork',
    component: LogoWithNetwork,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'range', min: 20, max: 100, step: 5 },
        },
    },
};

export default meta;

type Story = StoryObj<typeof LogoWithNetwork>;

export const WithNetworkBadge: Story = {
    args: {
        size: 40,
        src: 'https://ton.org/download/ton_symbol.png',
        alt: 'TON',
        networkSrc: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        networkAlt: 'ETH',
    },
};

export const FallbackOnly: Story = {
    args: {
        size: 40,
        fallback: 'BTC',
        alt: 'BTC',
        networkAlt: 'ETH',
    },
};

export const WithoutNetwork: Story = {
    args: {
        size: 40,
        src: 'https://ton.org/download/ton_symbol.png',
        alt: 'TON',
    },
};
