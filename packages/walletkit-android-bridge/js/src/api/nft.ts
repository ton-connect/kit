/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

/**
 * NFT helpers that proxy WalletKit operations to the native layer.
 */
import type {
    GetNftsArgs,
    GetNftArgs,
    CreateTransferNftTransactionArgs,
    CreateTransferNftRawTransactionArgs,
    CallContext,
} from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { walletKit } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { callOnWallet } from '../utils/helpers';

/**
 * Fetches NFT collections for a wallet.
 *
 * @param args - Wallet address and optional pagination.
 * @param context - Diagnostic context for tracing.
 */
export async function getNfts(args: GetNftsArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'getNfts:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'getNfts:after-ensureWalletKitLoaded');

    const limit = Number.isFinite(args.limit) && (args.limit as number) > 0 ? Math.floor(args.limit as number) : 100;
    const offset = Number.isFinite(args.offset) && (args.offset as number) >= 0 ? Math.floor(args.offset as number) : 0;

    console.log(
        '[walletkitBridge] getNfts fetching NFTs for address:',
        args.address,
        'limit:',
        limit,
        'offset:',
        offset,
    );
    emitCallCheckpoint(context, 'getNfts:before-wallet.getNfts');

    const result = await callOnWallet({ walletKit, requireWalletKit }, args.address, 'getNfts', { limit, offset });

    emitCallCheckpoint(context, 'getNfts:after-wallet.getNfts');
    console.log('[walletkitBridge] getNfts result:', result);

    return result;
}

/**
 * Fetches metadata for a single NFT owned by the wallet.
 *
 * @param args - Wallet address containing the NFT.
 * @param context - Diagnostic context for tracing.
 */
export async function getNft(args: GetNftArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'getNft:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'getNft:after-ensureWalletKitLoaded');

    console.log('[walletkitBridge] getNft fetching NFT for address:', args.address);
    emitCallCheckpoint(context, 'getNft:before-wallet.getNft');

    const result = await callOnWallet({ walletKit, requireWalletKit }, args.address, 'getNft');

    emitCallCheckpoint(context, 'getNft:after-wallet.getNft');
    console.log('[walletkitBridge] getNft result:', result);

    return result;
}

/**
 * Builds and returns an NFT transfer transaction.
 *
 * @param args - NFT movement parameters.
 * @param context - Diagnostic context for tracing.
 */
export async function createTransferNftTransaction(args: CreateTransferNftTransactionArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'createTransferNftTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createTransferNftTransaction:after-ensureWalletKitLoaded');

    console.log('[walletkitBridge] createTransferNftTransaction for NFT:', args.nftAddress, 'to:', args.toAddress);
    emitCallCheckpoint(context, 'createTransferNftTransaction:before-wallet.createTransferNftTransaction');

    const params = {
        nftAddress: args.nftAddress,
        transferAmount: args.transferAmount,
        toAddress: args.toAddress,
        comment: args.comment,
    };

    const result = await callOnWallet(
        { walletKit, requireWalletKit },
        args.address,
        'createTransferNftTransaction',
        params,
    );

    emitCallCheckpoint(context, 'createTransferNftTransaction:after-wallet.createTransferNftTransaction');
    console.log('[walletkitBridge] createTransferNftTransaction result:', result);

    return result;
}

/**
 * Builds a raw NFT transfer transaction using a pre-serialized message.
 *
 * @param args - NFT movement parameters with a raw transfer message.
 * @param context - Diagnostic context for tracing.
 */
export async function createTransferNftRawTransaction(
    args: CreateTransferNftRawTransactionArgs,
    context?: CallContext,
) {
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:after-ensureWalletKitLoaded');

    console.log('[walletkitBridge] createTransferNftRawTransaction for NFT:', args.nftAddress);
    emitCallCheckpoint(context, 'createTransferNftRawTransaction:before-wallet.createTransferNftRawTransaction');

    const params = {
        nftAddress: args.nftAddress,
        transferAmount: args.transferAmount,
        transferMessage: args.transferMessage,
    };

    const result = await callOnWallet(
        { walletKit, requireWalletKit },
        args.address,
        'createTransferNftRawTransaction',
        params,
    );

    emitCallCheckpoint(context, 'createTransferNftRawTransaction:after-wallet.createTransferNftRawTransaction');
    console.log('[walletkitBridge] createTransferNftRawTransaction result:', result);

    return result;
}
