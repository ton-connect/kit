/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwapWidget } from './swap-widget';

const meta: Meta<typeof SwapWidget> = {
    title: 'Public/Features/Swap/SwapWidget',
    component: SwapWidget,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SwapWidget>;

export const Default: Story = {
    args: {},
};
