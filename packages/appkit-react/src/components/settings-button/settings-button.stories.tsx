/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsButton } from './settings-button';

const meta: Meta<typeof SettingsButton> = {
    title: 'Public/Components/SettingsButton',
    component: SettingsButton,
};

export default meta;
type Story = StoryObj<typeof SettingsButton>;

export const Default: Story = {
    args: {
        onClick: () => {},
    },
};
