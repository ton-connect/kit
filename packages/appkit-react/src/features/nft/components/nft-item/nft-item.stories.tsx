/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

// Create a preview component that doesn't depend on context
const NftItemPreview = ({
    name,
    collectionName,
    image,
    isOnSale = false,
    onClick,
}: {
    name: string;
    collectionName: string;
    image?: string;
    isOnSale?: boolean;
    onClick?: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#1c1c1e',
                borderRadius: '12px',
                overflow: 'hidden',
                border: 'none',
                cursor: 'pointer',
                width: '160px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: '#2c2c2e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {image ? (
                    <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <svg
                        style={{ width: '48px', height: '48px', color: '#8e8e93' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                )}
            </div>
            <div style={{ padding: '12px', textAlign: 'left' }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: 600 }}>{name}</h4>
                <p style={{ margin: '4px 0 0', color: '#8e8e93', fontSize: '12px' }}>{collectionName}</p>
                {isOnSale && (
                    <span
                        style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: '#0098EB',
                            color: 'white',
                            fontSize: '10px',
                            borderRadius: '4px',
                        }}
                    >
                        On Sale
                    </span>
                )}
            </div>
        </button>
    );
};

const meta: Meta<typeof NftItemPreview> = {
    title: 'Public/Features/NFT/NftItem',
    component: NftItemPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    args: {
        onClick: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof NftItemPreview>;

export const WithImage: Story = {
    args: {
        name: 'TON Diamond #1234',
        collectionName: 'TON Diamonds',
        image: 'https://picsum.photos/200',
    },
};

export const WithoutImage: Story = {
    args: {
        name: 'Mystery NFT',
        collectionName: 'Unknown Collection',
    },
};

export const OnSale: Story = {
    args: {
        name: 'Rare NFT #001',
        collectionName: 'Rare Collection',
        image: 'https://picsum.photos/201',
        isOnSale: true,
    },
};

export const LongName: Story = {
    args: {
        name: 'Very Long NFT Name That Might Overflow The Container',
        collectionName: 'Long Collection Name Here',
        image: 'https://picsum.photos/202',
    },
};

export const NftGrid: Story = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <NftItemPreview
                name="TON Diamond #1"
                collectionName="TON Diamonds"
                image="https://picsum.photos/200"
                onClick={fn()}
            />
            <NftItemPreview
                name="TON Diamond #2"
                collectionName="TON Diamonds"
                image="https://picsum.photos/201"
                isOnSale
                onClick={fn()}
            />
            <NftItemPreview name="Mystery NFT" collectionName="Unknown" onClick={fn()} />
            <NftItemPreview
                name="Rare Item #123"
                collectionName="Rare Items"
                image="https://picsum.photos/203"
                onClick={fn()}
            />
        </div>
    ),
};
