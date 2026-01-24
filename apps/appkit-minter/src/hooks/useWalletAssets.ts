/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect, useCallback } from 'react';
import type { Jetton, NFT } from '@ton/walletkit';
import { isValidAddress } from '@ton/walletkit';
import { useConnectedWallets } from '@ton/appkit-ui-react';

interface WalletAssetsState {
    jettons: Jetton[];
    nfts: NFT[];
    isLoadingJettons: boolean;
    isLoadingNfts: boolean;
    jettonsError: string | null;
    nftsError: string | null;
}

interface TransferState {
    isTransferring: boolean;
    transferError: string | null;
}

export function useWalletAssets() {
    const connectedWallets = useConnectedWallets();
    const wallet = connectedWallets[0] || null;

    const [state, setState] = useState<WalletAssetsState>({
        jettons: [],
        nfts: [],
        isLoadingJettons: false,
        isLoadingNfts: false,
        jettonsError: null,
        nftsError: null,
    });

    const [transferState, setTransferState] = useState<TransferState>({
        isTransferring: false,
        transferError: null,
    });

    const loadJettons = useCallback(async () => {
        if (!wallet) return;

        setState((prev) => ({ ...prev, isLoadingJettons: true, jettonsError: null }));

        try {
            const response = await wallet.getJettons({
                pagination: { offset: 0, limit: 50 },
            });
            setState((prev) => ({
                ...prev,
                jettons: response.jettons,
                isLoadingJettons: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isLoadingJettons: false,
                jettonsError: error instanceof Error ? error.message : 'Failed to load jettons',
            }));
        }
    }, [wallet]);

    const loadNfts = useCallback(async () => {
        if (!wallet) return;

        setState((prev) => ({ ...prev, isLoadingNfts: true, nftsError: null }));

        try {
            const response = await wallet.getNfts({
                pagination: { offset: 0, limit: 50 },
            });
            setState((prev) => ({
                ...prev,
                nfts: response.nfts,
                isLoadingNfts: false,
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isLoadingNfts: false,
                nftsError: error instanceof Error ? error.message : 'Failed to load NFTs',
            }));
        }
    }, [wallet]);

    const refresh = useCallback(async () => {
        await Promise.all([loadJettons(), loadNfts()]);
    }, [loadJettons, loadNfts]);

    const transferJetton = useCallback(
        async (jetton: Jetton, recipientAddress: string, amount: string, comment?: string) => {
            if (!wallet) {
                throw new Error('Wallet not connected');
            }

            if (!isValidAddress(recipientAddress)) {
                throw new Error('Invalid recipient address');
            }

            const decimals = jetton.decimalsNumber ?? 9;
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                throw new Error('Invalid amount');
            }

            const transferAmount = Math.floor(amountNum * Math.pow(10, decimals)).toString();

            setTransferState({ isTransferring: true, transferError: null });

            try {
                const transaction = await wallet.createTransferJettonTransaction({
                    jettonAddress: jetton.address,
                    recipientAddress,
                    transferAmount,
                    comment,
                });

                await wallet.sendTransaction(transaction);
                setTransferState({ isTransferring: false, transferError: null });

                // Refresh jettons after transfer
                await loadJettons();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to transfer jetton';
                setTransferState({ isTransferring: false, transferError: errorMessage });
                throw error;
            }
        },
        [wallet, loadJettons],
    );

    const transferNft = useCallback(
        async (nft: NFT, recipientAddress: string, comment?: string) => {
            if (!wallet) {
                throw new Error('Wallet not connected');
            }

            if (!isValidAddress(recipientAddress)) {
                throw new Error('Invalid recipient address');
            }

            setTransferState({ isTransferring: true, transferError: null });

            try {
                const transaction = await wallet.createTransferNftTransaction({
                    nftAddress: nft.address,
                    recipientAddress,
                    comment,
                });

                await wallet.sendTransaction(transaction);
                setTransferState({ isTransferring: false, transferError: null });

                // Refresh NFTs after transfer
                await loadNfts();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to transfer NFT';
                setTransferState({ isTransferring: false, transferError: errorMessage });
                throw error;
            }
        },
        [wallet, loadNfts],
    );

    // Autoload assets when wallet connects
    useEffect(() => {
        if (wallet) {
            void loadJettons();
            void loadNfts();
        } else {
            // Clear assets when wallet disconnects
            setState({
                jettons: [],
                nfts: [],
                isLoadingJettons: false,
                isLoadingNfts: false,
                jettonsError: null,
                nftsError: null,
            });
        }
    }, [wallet, loadJettons, loadNfts]);

    return {
        ...state,
        ...transferState,
        loadJettons,
        loadNfts,
        refresh,
        transferJetton,
        transferNft,
    };
}
