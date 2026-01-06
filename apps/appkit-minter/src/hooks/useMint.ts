/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import { toNano } from '@ton/core';

import { useAppKit } from './useAppKit';

import { useMinterStore } from '@/store';

export function useMint() {
    const { currentCard, isMinting, mintError, setMinting, setMintError, mintCard } = useMinterStore();
    const { isConnected, address, getAppKit, getTonConnect } = useAppKit();

    const mint = useCallback(async () => {
        if (!currentCard || !isConnected || !address) {
            setMintError('Please connect your wallet first');
            return;
        }

        const appKit = getAppKit();
        const tonConnect = getTonConnect();

        if (!appKit || !tonConnect) {
            setMintError('AppKit not initialized');
            return;
        }

        const wallet = tonConnect.wallet;
        if (!wallet) {
            setMintError('Wallet not connected');
            return;
        }

        setMinting(true);
        setMintError(null);

        try {
            // Wrap the wallet using AppKit
            const wrappedWallet = appKit.wrapWallet(wallet);

            // Create a simple transfer transaction as a "mint" action
            // In a real app, this would call an NFT minting contract
            const transaction = await wrappedWallet.createTransferTonTransaction({
                recipientAddress: address, // Send to self as demo
                transferAmount: toNano('0.01').toString(), // Small amount for demo
                comment: `Minting NFT: ${currentCard.name} (${currentCard.rarity})`,
            });

            await wrappedWallet.sendTransaction(transaction);

            // Send the transaction through AppKit
            // await appKit.handleNewTransaction(wrappedWallet, transaction);

            // Update local state after successful mint
            await mintCard();
        } catch (error) {
            setMintError(error instanceof Error ? error.message : 'Failed to mint NFT');
        } finally {
            setMinting(false);
        }
    }, [currentCard, isConnected, address, getAppKit, getTonConnect, setMinting, setMintError, mintCard]);

    return {
        mint,
        isMinting,
        mintError,
        canMint: !!currentCard && isConnected,
    };
}
