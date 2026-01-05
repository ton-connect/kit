/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonWalletKit, TransactionRequestEvent } from '@ton/walletkit';
import { SEND_TRANSACTION_ERROR_CODES } from '@ton/walletkit';

import { tonConnectLog } from '../utils';
import { enqueueRequest } from './enqueue-request';
import { handleDisconnectEvent } from './handle-disconnect-event';

export const setupTonConnectListeners = (walletKit: ITonWalletKit) => {
    walletKit.onConnectRequest((event) => {
        tonConnectLog.info('Connect request received:', event);
        if (event?.preview?.manifestFetchErrorCode) {
            tonConnectLog.error(
                'Connect request received with manifest fetch error:',
                event?.preview?.manifestFetchErrorCode,
            );

            walletKit.rejectConnectRequest(
                event,
                event?.preview?.manifestFetchErrorCode == 2
                    ? 'App manifest not found'
                    : event?.preview?.manifestFetchErrorCode == 3
                      ? 'App manifest content error'
                      : undefined,
                event.preview.manifestFetchErrorCode,
            );
            return;
        }

        enqueueRequest({
            type: 'connect',
            request: event,
        });
    });

    walletKit.onTransactionRequest(async (event: TransactionRequestEvent) => {
        const wallet = await walletKit.getWallet(event.walletId ?? '');
        if (!wallet) {
            tonConnectLog.error('Wallet not found for transaction request', { walletId: event.walletId });
            return;
        }

        const balance = await wallet.getBalance();
        const minNeededBalance = event.request.messages.reduce((acc, message) => acc + BigInt(message.amount), 0n);
        if (BigInt(balance) < minNeededBalance) {
            await walletKit.rejectTransactionRequest(event, {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: 'Insufficient balance',
            });
            return;
        }

        enqueueRequest({
            type: 'transaction',
            request: event,
        });
    });

    walletKit.onSignDataRequest((event) => {
        tonConnectLog.info('Sign data request received:', event);
        enqueueRequest({
            type: 'signData',
            request: event,
        });
    });

    walletKit.onDisconnect((event) => {
        tonConnectLog.info('Disconnect event received:', event);
        handleDisconnectEvent(event);
    });

    tonConnectLog.info('TonConnect listeners initialized');
};
