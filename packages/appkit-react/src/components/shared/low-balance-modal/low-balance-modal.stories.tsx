/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { LowBalanceModal } from './low-balance-modal';

const meta: Meta<typeof LowBalanceModal> = {
    title: 'Components/Shared/LowBalanceModal',
    component: LowBalanceModal,
};

export default meta;
type Story = StoryObj<typeof LowBalanceModal>;

export const Default: Story = {
    args: {
        open: true,
        mode: 'reduce',
        requiredTon: '0.423',
        onChange: () => {},
        onCancel: () => {},
    },
};

export const Topup: Story = {
    args: {
        open: true,
        mode: 'topup',
        requiredTon: '0.423',
        onChange: () => {},
        onCancel: () => {},
    },
};
