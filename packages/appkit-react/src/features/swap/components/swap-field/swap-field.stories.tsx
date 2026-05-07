/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../../storybook/fixtures/tokens';
import { SwapField } from './swap-field';

const meta: Meta<typeof SwapField> = {
    title: 'Features/Swap/Internal/SwapField',
    component: SwapField,
};

export default meta;
type Story = StoryObj<typeof SwapField>;

export const Pay: Story = {
    args: {
        type: 'pay',
        token: STORY_TOKENS[0], // TON
        amount: '10',
        balance: '100000000000',
        onAmountChange: () => {},
        isWalletConnected: true,
    },
};

export const Receive: Story = {
    args: {
        type: 'receive',
        token: STORY_TOKENS[1], // USDT
        amount: '25',
        balance: '500000000',
        isWalletConnected: true,
    },
};

export const Loading: Story = {
    args: {
        ...Receive.args,
        loading: true,
    },
};

export const NoWallet: Story = {
    args: {
        ...Pay.args,
        isWalletConnected: false,
    },
};
