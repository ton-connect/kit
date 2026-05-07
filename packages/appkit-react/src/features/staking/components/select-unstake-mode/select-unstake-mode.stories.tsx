/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnstakeMode } from '@ton/appkit';

import { SelectUnstakeMode } from './select-unstake-mode';

const meta: Meta<typeof SelectUnstakeMode> = {
    title: 'Features/Staking/Internal/SelectUnstakeMode',
    component: SelectUnstakeMode,
};

export default meta;
type Story = StoryObj<typeof SelectUnstakeMode>;

const mockMetadata = {
    name: 'Tonstakers',
    providerId: 'tonstakers',
    stakeToken: {
        symbol: 'TON',
        ticker: 'TON',
        decimals: 9,
        address: 'ton',
    },
    supportedUnstakeModes: [UnstakeMode.INSTANT, UnstakeMode.ROUND_END, UnstakeMode.WHEN_AVAILABLE],
    supportsReversedQuote: false,
};

const mockProviderInfo = {
    instantUnstakeAvailable: '10000000000',
    exchangeRate: '1.05',
    apy: 4.5,
};

export const Default: Story = {
    args: {
        value: UnstakeMode.INSTANT,
        onValueChange: () => {},
        providerInfo: mockProviderInfo,
        providerMetadata: mockMetadata,
    },
};

export const LimitedModes: Story = {
    args: {
        ...Default.args,
        providerMetadata: {
            ...mockMetadata,
            supportedUnstakeModes: [UnstakeMode.INSTANT],
        },
    },
};
