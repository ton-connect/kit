/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ButtonWithConnect } from './button-with-connect';

const meta: Meta<typeof ButtonWithConnect> = {
    title: 'Components/Shared/ButtonWithConnect',
    component: ButtonWithConnect,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ButtonWithConnect>;

export const Default: Story = {
    args: {
        children: 'Continue',
        variant: 'fill',
        size: 'l',
        fullWidth: true,
        onClick: fn(),
    },
};

export const Disabled: Story = {
    args: {
        children: 'Continue',
        variant: 'fill',
        size: 'l',
        fullWidth: true,
        disabled: true,
        onClick: fn(),
    },
};
