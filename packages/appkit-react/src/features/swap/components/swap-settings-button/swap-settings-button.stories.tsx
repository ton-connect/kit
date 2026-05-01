/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwapSettingsButton } from './swap-settings-button';

const meta: Meta<typeof SwapSettingsButton> = {
    title: 'Public/Features/Swap/Internal/SwapSettingsButton',
    component: SwapSettingsButton,
};

export default meta;
type Story = StoryObj<typeof SwapSettingsButton>;

export const Default: Story = {
    args: {
        onClick: () => {},
    },
};
