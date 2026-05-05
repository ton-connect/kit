/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Network } from '@ton/appkit';

import { OnrampInfoBlock } from './onramp-info-block';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';

const TON_TOKEN: AppkitUIToken = {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    address: 'ton',
    logo: 'https://asset.ston.fi/img/EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv',
    network: Network.mainnet(),
};

const meta: Meta<typeof OnrampInfoBlock> = {
    title: 'Public/Features/Onramp/Internal/OnrampInfoBlock',
    component: OnrampInfoBlock,
};

export default meta;
type Story = StoryObj<typeof OnrampInfoBlock>;

export const Default: Story = {
    args: {
        selectedToken: TON_TOKEN,
        selectedQuote: {
            fiatCurrency: 'USD',
            cryptoCurrency: 'TON',
            fiatAmount: '100',
            cryptoAmount: '50.123456',
            rate: '0.50123456',
            providerId: 'appkit-onramp',
        },
        isLoading: false,
    },
};

export const Loading: Story = {
    args: {
        selectedToken: TON_TOKEN,
        selectedQuote: undefined,
        isLoading: true,
    },
};
