/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { ChainId } from '@tonconnect/protocol';

import type { ReturnWithValidationResult } from '../validation/types';
import { isValidAddress } from '../utils/address';
import type { Wallet } from '../api/interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateNetwork(network: any, wallet: Wallet): ReturnWithValidationResult<ChainId | undefined> {
    let errors: string[] = [];
    if (typeof network === 'string') {
        const walletNetwork = wallet.getNetwork();
        if (network !== walletNetwork.chainId) {
            errors.push('Invalid network not equal to wallet network');
        } else {
            return { result: network, isValid: errors.length === 0, errors: errors };
        }
    } else {
        errors.push('Invalid network not a string');
    }
    return { result: undefined, isValid: errors.length === 0, errors: errors };
}

export function validateFrom(from: unknown, wallet: Wallet): ReturnWithValidationResult<string> {
    let errors: string[] = [];
    if (typeof from !== 'string') {
        errors.push('Invalid from address not a string');
        return { result: '', isValid: errors.length === 0, errors: errors };
    }
    if (!isValidAddress(from)) {
        errors.push('Invalid from address');
        return { result: '', isValid: errors.length === 0, errors: errors };
    }
    const fromAddress = Address.parse(from);
    const walletAddress = Address.parse(wallet.getAddress());
    if (!fromAddress.equals(walletAddress)) {
        errors.push('Invalid from address not equal to wallet address');
        return { result: '', isValid: errors.length === 0, errors: errors };
    }
    return { result: from, isValid: errors.length === 0, errors: errors };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateValidUntil(validUntil: any): ReturnWithValidationResult<number> {
    let errors: string[] = [];
    if (typeof validUntil === 'undefined') {
        return { result: 0, isValid: errors.length === 0, errors: errors };
    }
    if (typeof validUntil !== 'number' || isNaN(validUntil)) {
        errors.push('Invalid validUntil timestamp not a number');
        return { result: 0, isValid: errors.length === 0, errors: errors };
    }
    const now = Math.floor(Date.now() / 1000);
    if (validUntil < now) {
        errors.push('Invalid validUntil timestamp');
        return { result: 0, isValid: errors.length === 0, errors: errors };
    }
    return { result: validUntil, isValid: errors.length === 0, errors: errors };
}
