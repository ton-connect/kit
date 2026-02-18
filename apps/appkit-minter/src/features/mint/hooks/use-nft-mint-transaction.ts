/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import { toNano, Address, beginCell, storeStateInit } from '@ton/core';
import { useSelectedWallet } from '@ton/appkit-react';
import type { Base64String, TransactionRequest } from '@ton/appkit';

import { useMinterStore } from '../store/minter-store';
import { buildSingleNftStateInit, encodeOnChainContent } from '../contracts';

type UseNftTransactionType =
    | {
          canMint: true;
          createMintTransaction: () => Promise<TransactionRequest>;
      }
    | {
          canMint: false;
          createMintTransaction: () => Promise<null>;
      };

/**
 * Hook to create NFT mint transaction request
 */
export function useNftMintTransaction(): UseNftTransactionType {
    const currentCard = useMinterStore((state) => state.currentCard);
    const [wallet] = useSelectedWallet();

    const createMintTransaction = useCallback(async (): Promise<TransactionRequest> => {
        if (!currentCard || !wallet) {
            throw new Error('Cannot mint NFT: No current card or wallet');
        }

        const walletAddress = Address.parse(wallet.getAddress());

        // Build on-chain NFT metadata content cell
        const contentCell = encodeOnChainContent({
            name: currentCard.name,
            description: currentCard.description,
            image: currentCard.imageUrl,
        });

        // Build NFT StateInit
        const { stateInit, address: nftAddress } = buildSingleNftStateInit({
            ownerAddress: walletAddress,
            editorAddress: walletAddress,
            contentCell,
            royaltyParams: {
                royaltyFactor: 0,
                royaltyBase: 1000,
                royaltyAddress: walletAddress,
            },
        });

        // Create deployment message
        const stateInitCell = beginCell().store(storeStateInit(stateInit)).endCell();

        return {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
            messages: [
                {
                    address: nftAddress.toString(),
                    amount: toNano('0.05').toString(), // 0.05 TON for deployment
                    stateInit: stateInitCell.toBoc().toString('base64') as Base64String,
                },
            ],
        };
    }, [currentCard, wallet]);

    const canMint = !!currentCard && !!wallet;

    if (canMint) {
        return {
            createMintTransaction,
            canMint: true,
        };
    } else {
        return {
            createMintTransaction: () => Promise.reject(new Error('Cannot mint NFT: No current card or wallet')),
            canMint: false,
        };
    }
}
