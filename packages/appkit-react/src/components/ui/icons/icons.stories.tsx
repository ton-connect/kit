/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FC } from 'react';

import { ChevronsIcon } from './chevrons-icon';
import { ChevronDownIcon } from './chevron-down-icon';
import { CloseIcon } from './close-icon';
import { FailedIcon } from './failed-icon';
import { FlipIcon } from './flip-icon';
import { ImageIcon } from './image-icon';
import { SearchIcon } from './search-icon';
import { SlidersIcon } from './sliders-icon';
import { SpinnerIcon } from './spinner-icon';
import { SuccessIcon } from './success-icon';
import { TonIcon, TonIconCircle } from './ton-icon';
import { VerifiedIcon } from './verified-icon';
import type { IconProps } from './types';

const ICONS: { name: string; Component: FC<IconProps> }[] = [
    { name: 'ChevronsIcon', Component: ChevronsIcon },
    { name: 'ChevronDownIcon', Component: ChevronDownIcon },
    { name: 'CloseIcon', Component: CloseIcon },
    { name: 'FailedIcon', Component: FailedIcon },
    { name: 'FlipIcon', Component: FlipIcon },
    { name: 'ImageIcon', Component: ImageIcon },
    { name: 'SearchIcon', Component: SearchIcon },
    { name: 'SlidersIcon', Component: SlidersIcon },
    { name: 'SpinnerIcon', Component: SpinnerIcon },
    { name: 'SuccessIcon', Component: SuccessIcon },
    { name: 'TonIcon', Component: TonIcon },
    { name: 'TonIconCircle', Component: TonIconCircle },
    { name: 'VerifiedIcon', Component: VerifiedIcon },
];

const Gallery: FC = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            maxWidth: 720,
            color: 'var(--ta-color-text)',
        }}
    >
        {ICONS.map(({ name, Component }) => (
            <div
                key={name}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    padding: 20,
                    aspectRatio: '1 / 1',
                    background: 'var(--ta-color-background-secondary)',
                    borderRadius: 12,
                }}
            >
                <Component />
                <code style={{ fontSize: 12, textAlign: 'center', color: 'var(--ta-color-text-secondary)' }}>
                    {name}
                </code>
            </div>
        ))}
    </div>
);

const meta: Meta<typeof Gallery> = {
    title: 'Components/UI/Icons',
    component: Gallery,
};

export default meta;

type Story = StoryObj<typeof Gallery>;

export const All: Story = {};
