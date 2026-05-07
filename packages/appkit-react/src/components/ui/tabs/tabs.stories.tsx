/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta: Meta<typeof Tabs> = {
    title: 'Components/UI/Tabs',
    component: Tabs,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="stake" style={{ maxWidth: 440 }}>
            <TabsList>
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="unstake">Unstake</TabsTrigger>
            </TabsList>
            <TabsContent value="stake">
                <div style={{ padding: 16 }}>Stake content</div>
            </TabsContent>
            <TabsContent value="unstake">
                <div style={{ padding: 16 }}>Unstake content</div>
            </TabsContent>
        </Tabs>
    ),
};

export const Controlled: Story = {
    render: () => {
        const [value, setValue] = useState('tab1');
        return (
            <Tabs value={value} onValueChange={setValue} style={{ maxWidth: 440 }}>
                <TabsList>
                    <TabsTrigger value="tab1">First</TabsTrigger>
                    <TabsTrigger value="tab2">Second</TabsTrigger>
                    <TabsTrigger value="tab3">Third</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                    <div style={{ padding: 16 }}>First tab content</div>
                </TabsContent>
                <TabsContent value="tab2">
                    <div style={{ padding: 16 }}>Second tab content</div>
                </TabsContent>
                <TabsContent value="tab3">
                    <div style={{ padding: 16 }}>Third tab content</div>
                </TabsContent>
            </Tabs>
        );
    },
};
