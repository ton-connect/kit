/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import { toNano } from '@ton/core';
import { useConnectedWallets } from '@ton/appkit-ui-react';

import { useMinterStore } from '@/store';

export function useMint() {
    const { currentCard, isMinting, mintError, setMinting, setMintError, mintCard } = useMinterStore();
    const connectedWallets = useConnectedWallets();
    const wallet = connectedWallets[0] || null;
    const isConnected = !!wallet;

    const mint = useCallback(async () => {
        if (!currentCard || !wallet) {
            setMintError('Please connect your wallet first');
            return;
        }

        setMinting(true);
        setMintError(null);

        try {
            // Create a simple transfer transaction as a "mint" action
            // In a real app, this would call an NFT minting contract
            const transaction = await wallet.createTransferTonTransaction({
                recipientAddress: wallet.getAddress(), // Send to self as demo
                transferAmount: toNano('0.01').toString(), // Small amount for demo
                comment: `Minting NFT: ${currentCard.name} (${currentCard.rarity})`,
            });

            await wallet.sendTransaction(transaction);

            // Send the transaction through AppKit
            // await appKit.handleNewTransaction(wrappedWallet, transaction);

            // Update local state after successful mint
            await mintCard();
        } catch (error) {
            setMintError(error instanceof Error ? error.message : 'Failed to mint NFT');
        } finally {
            setMinting(false);
        }
    }, [currentCard, isConnected, setMinting, setMintError, mintCard]);

    return {
        mint,
        isMinting,
        mintError,
        canMint: !!currentCard && isConnected,
    };
}
