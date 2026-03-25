/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';

const meta: Meta<typeof Input> = {
    title: 'Components/Input',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
    render: (args) => (
        <Input.Container {...args} style={{ width: '400px' }}>
            <Input.Header>
                <Input.Title>Title</Input.Title>
            </Input.Header>
            <Input.Field>
                <Input.Input placeholder="Placeholder" />
            </Input.Field>
            <Input.Caption>Caption text</Input.Caption>
        </Input.Container>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '400px' }}>
            {(['s', 'm', 'l'] as const).map((size) => (
                <Input.Container key={size} size={size}>
                    <Input.Header>
                        <Input.Title>Size {size.toUpperCase()}</Input.Title>
                    </Input.Header>
                    <Input.Field>
                        <Input.Input placeholder={`Input size ${size}`} />
                    </Input.Field>
                </Input.Container>
            ))}
        </div>
    ),
};

export const Unstyled: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '400px' }}>
            {(['s', 'm', 'l'] as const).map((size) => (
                <Input.Container key={size} size={size} variant="unstyled">
                    <Input.Field>
                        <Input.Input placeholder={`Unstyled size ${size}`} />
                    </Input.Field>
                </Input.Container>
            ))}
        </div>
    ),
};

export const States: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '400px' }}>
            <Input.Container error>
                <Input.Header>
                    <Input.Title>Error State</Input.Title>
                </Input.Header>
                <Input.Field>
                    <Input.Input defaultValue="Invalid value" />
                </Input.Field>
                <Input.Caption>This is an error message</Input.Caption>
            </Input.Container>

            <Input.Container disabled>
                <Input.Header>
                    <Input.Title>Disabled State</Input.Title>
                </Input.Header>
                <Input.Field>
                    <Input.Input defaultValue="Locked value" />
                </Input.Field>
            </Input.Container>

            <Input.Container loading>
                <Input.Header>
                    <Input.Title>Loading State</Input.Title>
                </Input.Header>
                <Input.Field>
                    <Input.Input placeholder="Fetching data..." />
                </Input.Field>
            </Input.Container>
        </div>
    ),
};

export const Advanced: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '400px' }}>
            <Input.Container size="l">
                <Input.Header>
                    <Input.Title>You swap</Input.Title>
                </Input.Header>
                <Input.Field>
                    <Input.Input defaultValue="100" />
                    <Input.Slot side="right">
                        <div
                            style={{
                                background: 'var(--ta-color-background)',
                                padding: '4px 8px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px',
                                fontWeight: 600,
                            }}
                        >
                            TON ▾
                        </div>
                    </Input.Slot>
                </Input.Field>
                <Input.Caption>$ 144.74</Input.Caption>
            </Input.Container>
        </div>
    ),
};
