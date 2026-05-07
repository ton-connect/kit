/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta: Meta<typeof Button> = {
    title: 'Components/UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['s', 'm', 'l', 'unset'],
        },
        borderRadius: {
            control: 'select',
            options: ['s', 'm', 'l', 'xl', '2xl', 'full'],
        },
        variant: {
            control: 'select',
            options: ['fill', 'secondary', 'bezeled', 'gray', 'ghost', 'unstyled'],
        },
        disabled: {
            control: 'boolean',
        },
        loading: {
            control: 'boolean',
        },
        fullWidth: {
            control: 'boolean',
        },
    },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Fill: Story = {
    args: {
        children: 'Action',
        variant: 'fill',
        size: 'l',
    },
};

export const Bezeled: Story = {
    args: {
        children: 'Action',
        variant: 'bezeled',
        size: 'l',
    },
};

export const Gray: Story = {
    args: {
        children: 'Action',
        variant: 'gray',
        size: 'l',
    },
};

export const Sizes: Story = {
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Button {...args} size="l">
                Large Button
            </Button>
            <Button {...args} size="m">
                Medium Button
            </Button>
            <Button {...args} size="s">
                Small Button
            </Button>
        </div>
    ),
    args: {
        variant: 'fill',
    },
};

export const Variants: Story = {
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Button {...args} variant="fill">
                Fill Button
            </Button>
            <Button {...args} variant="bezeled">
                Bezeled Button
            </Button>
            <Button {...args} variant="gray">
                Gray Button
            </Button>
        </div>
    ),
    args: {
        size: 'l',
    },
};

export const Loading: Story = {
    args: {
        children: 'Loading Button',
        loading: true,
    },
};

export const Unstyled: Story = {
    args: {
        children: 'Bare button',
        variant: 'unstyled',
        size: 'unset',
    },
};
