/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwapLowBalanceModal } from './swap-low-balance-modal';

const meta: Meta<typeof SwapLowBalanceModal> = {
    title: 'Public/Features/Swap/Internal/SwapLowBalanceModal',
    component: SwapLowBalanceModal,
};

export default meta;
type Story = StoryObj<typeof SwapLowBalanceModal>;

export const Default: Story = {
    args: {
        open: true,
        requiredTon: '0.423',
        onChange: () => {},
        onCancel: () => {},
    },
};
