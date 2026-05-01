/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwapFlipButton } from './swap-flip-button';

const meta: Meta<typeof SwapFlipButton> = {
    title: 'Public/Features/Swap/Internal/SwapFlipButton',
    component: SwapFlipButton,
};

export default meta;
type Story = StoryObj<typeof SwapFlipButton>;

export const Default: Story = {
    args: {
        rotated: false,
        onClick: () => {},
    },
};

export const Rotated: Story = {
    args: {
        rotated: true,
        onClick: () => {},
    },
};
