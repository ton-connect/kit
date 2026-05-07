/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** @vitest-environment happy-dom */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as AppKitReact from '@ton/appkit-react';
import { Address } from '@ton/core';

import { UseNftExample } from './use-nft';
import { UseNftsByAddressExample } from './use-nfts-by-address';
import { UseNftsExample } from './use-nfts';
import { UseTransferNftExample } from './use-transfer-nft';

// Mock the whole module
vi.mock('@ton/appkit-react', async () => {
    const actual = await vi.importActual('@ton/appkit-react');
    return {
        ...actual,
        useNft: vi.fn(),
        useNftsByAddress: vi.fn(),
        useNfts: vi.fn(),
        useTransferNft: vi.fn(),
    };
});

describe('NFT Hooks Examples', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UseNftExample', () => {
        it('should render loading state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useNft).mockReturnValue({
                isLoading: true,
                data: undefined,
                error: null,
            });

            render(<UseNftExample />);
            expect(screen.getByText('Loading...')).toBeDefined();
        });

        it('should render error state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useNft).mockReturnValue({
                isLoading: false,
                data: undefined,
                error: new Error('Failed to fetch'),
            });

            render(<UseNftExample />);
            expect(screen.getByText('Error: Failed to fetch')).toBeDefined();
        });

        it('should render NFT details', () => {
            vi.mocked(AppKitReact.useNft).mockReturnValue({
                isLoading: false,
                data: {
                    info: { name: 'Epic NFT' },
                    collection: { name: 'Epic Collection' },
                    ownerAddress: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
                },
                error: null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            render(<UseNftExample />);
            expect(screen.getByText('Name: Epic NFT')).toBeDefined();
            expect(screen.getByText('Collection: Epic Collection')).toBeDefined();
            expect(screen.getByText('Owner: EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c')).toBeDefined();
        });
    });

    describe('UseNftsByAddressExample', () => {
        it('should render list of NFTs', () => {
            vi.mocked(AppKitReact.useNftsByAddress).mockReturnValue({
                isLoading: false,
                data: {
                    nfts: [
                        {
                            address: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
                            info: { name: 'NFT 1' },
                            collection: { name: 'Coll 1' },
                        },
                    ],
                },
                error: null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            render(<UseNftsByAddressExample />);
            expect(screen.getByText('NFT 1 (Coll 1)')).toBeDefined();
        });
    });

    describe('UseNftsExample', () => {
        it('should render my NFTs', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useNfts).mockReturnValue({
                isLoading: false,
                data: {
                    nfts: [
                        {
                            address: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
                            info: { name: 'My NFT' },
                            collection: { name: 'My Coll' },
                        },
                    ],
                },
                error: null,
            });

            render(<UseNftsExample />);
            expect(screen.getByText('My NFT (My Coll)')).toBeDefined();
        });
    });

    describe('UseTransferNftExample', () => {
        it('should call transfer mutation on button click', () => {
            const mockMutate = vi.fn();
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useTransferNft).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
                error: null,
            });

            render(<UseTransferNftExample />);
            const button = screen.getByText('Transfer NFT');
            fireEvent.click(button);

            expect(mockMutate).toHaveBeenCalledWith({
                nftAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                comment: 'Gift for you',
            });
        });

        it('should disable button when loading', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useTransferNft).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
                error: null,
            });

            render(<UseTransferNftExample />);
            const button = screen.getByText('Transferring...');
            expect(button.closest('button')?.disabled).toBe(true);
        });
    });
});
