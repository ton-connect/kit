/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ChevronDownIcon } from '../icons';
import { Select } from './select';

const meta: Meta<typeof Select.Root> = {
    title: 'Components/UI/Select',
    component: Select.Root,
};

export default meta;

type Story = StoryObj<typeof Select.Root>;

const PROVIDERS = [
    { value: 'stonfi', label: 'STON.fi' },
    { value: 'dedust', label: 'DeDust' },
    { value: 'omniston', label: 'Omniston' },
];

export const Uncontrolled: Story = {
    render: () => (
        <Select.Root defaultValue="stonfi" onValueChange={fn()}>
            <Select.Trigger variant="gray" size="m" borderRadius="l">
                STON.fi
                <ChevronDownIcon size={16} />
            </Select.Trigger>
            <Select.Content>
                {PROVIDERS.map((p) => (
                    <Select.Item key={p.value} value={p.value}>
                        {p.label}
                    </Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    ),
};

export const Controlled: Story = {
    render: () => {
        const Wrapper = () => {
            const [value, setValue] = useState('stonfi');
            const current = PROVIDERS.find((p) => p.value === value);
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Select.Root value={value} onValueChange={setValue}>
                        <Select.Trigger variant="gray" size="m" borderRadius="l">
                            {current?.label ?? value}
                            <ChevronDownIcon size={16} />
                        </Select.Trigger>
                        <Select.Content>
                            {PROVIDERS.map((p) => (
                                <Select.Item key={p.value} value={p.value}>
                                    {p.label}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                    <span style={{ fontSize: 12, color: 'var(--ta-color-text-secondary)' }}>Selected: {value}</span>
                </div>
            );
        };
        return <Wrapper />;
    },
};

export const AlignedEnd: Story = {
    render: () => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: 320 }}>
            <Select.Root defaultValue="dedust">
                <Select.Trigger variant="gray" size="m" borderRadius="l">
                    DeDust
                    <ChevronDownIcon size={16} />
                </Select.Trigger>
                <Select.Content align="end">
                    {PROVIDERS.map((p) => (
                        <Select.Item key={p.value} value={p.value}>
                            {p.label}
                        </Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <Select.Root defaultValue="stonfi" disabled>
            <Select.Trigger variant="gray" size="m" borderRadius="l">
                STON.fi
                <ChevronDownIcon size={16} />
            </Select.Trigger>
            <Select.Content>
                {PROVIDERS.map((p) => (
                    <Select.Item key={p.value} value={p.value}>
                        {p.label}
                    </Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    ),
};

export const GhostTrigger: Story = {
    render: () => (
        <Select.Root defaultValue="stonfi">
            <Select.Trigger variant="ghost" size="s">
                STON.fi
                <ChevronDownIcon size={16} />
            </Select.Trigger>
            <Select.Content align="end">
                {PROVIDERS.map((p) => (
                    <Select.Item key={p.value} value={p.value}>
                        {p.label}
                    </Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    ),
};
