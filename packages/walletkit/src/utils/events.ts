/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient, Wallet } from '../api/interfaces';
import type { TransactionRequest } from '../api/models';
import type { WalletManager } from '../core/WalletManager';
import { ERROR_CODES, WalletKitError } from '../errors';
import { validateFrom, validateNetwork, validateValidUntil } from '../handlers/transactionValidators';
import { parseConnectTransactionParamContent, toTransactionRequest } from '../types/internal';
import type {
    RawBridgeEventSignMessage,
    RawBridgeEventTransaction,
    RawConnectTransactionParamContent,
} from '../types/internal';
import type { ValidationResult } from '../validation';
import { validateStructuredItems, validateTransactionMessages } from '../validation/transaction';
import { resolveItemsToMessages } from './itemsResolver';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('EventsUtils');

/**
 * Helper to get wallet from event
 */
export function getWalletFromEvent(walletManager: WalletManager, event: { walletId?: string }): Wallet | undefined {
    if (event.walletId) {
        return walletManager.getWallet(event.walletId);
    }
    return undefined;
}

export function getWalletAddressFromEvent(
    walletManager: WalletManager,
    event: { walletId?: string; walletAddress?: string },
): string | undefined {
    if (event.walletAddress) {
        return event.walletAddress;
    }
    if (event.walletId) {
        return walletManager.getWallet(event.walletId)?.getAddress();
    }
    return undefined;
}

export function getClientForWallet(walletManager: WalletManager, event: { walletId?: string }): ApiClient {
    const wallet = getWalletFromEvent(walletManager, event);
    if (!wallet) {
        throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${event.walletId}`);
    }

    return wallet.getClient();
}

export async function checkTransactionRequestItems(
    request: TransactionRequest,
    wallet: Wallet,
): Promise<TransactionRequest> {
    if (!request.items || request.items.length === 0) {
        return { ...request };
    }

    const newRequest = { ...request };
    newRequest.messages = await resolveItemsToMessages(request.items, wallet);
    // probably we should not remove items here, it can be used for analytics and debugging
    // newRequest.items = undefined;

    return newRequest;
}

export function validateTransactionRequestForWallet(
    request: TransactionRequest,
    wallet: Wallet,
    isLocal?: boolean,
    requireNetworkAndFrom: boolean = true,
): ValidationResult {
    let errors: string[] = [];

    const validUntilValidation = validateValidUntil(request.validUntil);
    if (!validUntilValidation.isValid) {
        errors = errors.concat(validUntilValidation.errors);
    }

    if (requireNetworkAndFrom || request.network?.chainId) {
        const networkValidation = validateNetwork(request.network?.chainId, wallet);
        if (!networkValidation.isValid) {
            errors = errors.concat(networkValidation.errors);
        }
    }

    if (requireNetworkAndFrom || request.fromAddress) {
        const fromValidation = validateFrom(request.fromAddress, wallet);
        if (!fromValidation.isValid) {
            errors = errors.concat(fromValidation.errors);
        }
    }

    if (request.items && request.items.length > 0) {
        const itemsValidation = validateStructuredItems(request.items);
        if (!itemsValidation.isValid) {
            errors = errors.concat(itemsValidation.errors);
        }
    } else {
        const messagesValidation = validateTransactionMessages(request.messages ?? [], !isLocal, true);
        if (!messagesValidation.isValid) {
            errors = errors.concat(messagesValidation.errors);
        }
    }

    return { isValid: errors.length === 0, errors };
}

export function parseTonConnectTransactionRequest(
    event: RawBridgeEventTransaction | RawBridgeEventSignMessage,
    wallet: Wallet,
): {
    result: TransactionRequest | undefined;
    validation: ValidationResult;
} {
    let errors: string[] = [];
    try {
        if (event.params.length !== 1) {
            throw new WalletKitError(
                ERROR_CODES.INVALID_REQUEST_EVENT,
                'Invalid transaction request - expected exactly 1 parameter',
                undefined,
                { paramCount: event.params.length, eventId: event.id },
            );
        }
        const rawParams = JSON.parse(event.params[0]) as RawConnectTransactionParamContent;
        const params = parseConnectTransactionParamContent(rawParams);
        const request = toTransactionRequest(params);
        const validation = validateTransactionRequestForWallet(request, wallet, event.isLocal);

        return {
            result: request,
            validation,
        };
    } catch (error) {
        log.error('Failed to parse transaction request', { error });
        errors.push('Failed to parse transaction request');
        return {
            result: undefined,
            validation: { isValid: errors.length === 0, errors: errors },
        };
    }
}
