/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Dialog } from './dialog';
import { Button } from '../button';

const meta: Meta<typeof Dialog.Root> = {
    title: 'Components/UI/Dialog',
    component: Dialog.Root,
};

export default meta;

type Story = StoryObj<typeof Dialog.Root>;

const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const contentStyle: CSSProperties = {
    background: 'var(--ta-color-background)',
    color: 'var(--ta-color-text)',
    padding: 24,
    borderRadius: 16,
    minWidth: 320,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
};

export const Default: Story = {
    render: () => {
        const Wrapper = () => {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <Button onClick={() => setOpen(true)}>Open Dialog</Button>
                    <Dialog.Root open={open} onOpenChange={setOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay style={overlayStyle} onClick={() => setOpen(false)}>
                                <Dialog.Content style={contentStyle} onClick={(e) => e.stopPropagation()}>
                                    <Dialog.Title style={{ margin: '0 0 12px' }}>Dialog title</Dialog.Title>
                                    <p style={{ margin: '0 0 16px' }}>
                                        Bare Dialog primitive. Most consumers should use the higher-level Modal
                                        component instead.
                                    </p>
                                    <Dialog.Close
                                        style={{
                                            background: 'var(--ta-color-primary)',
                                            color: 'var(--ta-color-primary-foreground)',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Close
                                    </Dialog.Close>
                                </Dialog.Content>
                            </Dialog.Overlay>
                        </Dialog.Portal>
                    </Dialog.Root>
                </>
            );
        };
        return <Wrapper />;
    },
};
