/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampFee } from '../../../api/models';
import type {
    AppkitOnrampBuildUrlResponse,
    AppkitOnrampGetQuoteResponse,
    AppkitOnrampQuote,
    AppkitOnrampServiceMetadata,
} from './types';

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const isOnrampFee = (value: unknown): value is OnrampFee => {
    if (!isObject(value)) return false;
    if (value.type !== 'service' && value.type !== 'network' && value.type !== 'processing') return false;
    return typeof value.amount === 'string' && typeof value.currency === 'string';
};

const isAppkitOnrampServiceMetadata = (value: unknown): value is AppkitOnrampServiceMetadata => {
    if (!isObject(value)) return false;
    return (
        typeof value.providerId === 'string' &&
        typeof value.name === 'string' &&
        typeof value.url === 'string' &&
        typeof value.darkLogo === 'string' &&
        typeof value.lightLogo === 'string' &&
        isStringArray(value.paymentMethods) &&
        typeof value.supportUrl === 'string'
    );
};

const isAppkitOnrampQuote = (value: unknown): value is AppkitOnrampQuote => {
    if (!isObject(value)) return false;
    return (
        typeof value.fiatCurrency === 'string' &&
        typeof value.cryptoCurrency === 'string' &&
        typeof value.fiatAmount === 'string' &&
        typeof value.cryptoAmount === 'string' &&
        typeof value.rate === 'string' &&
        Array.isArray(value.fees) &&
        value.fees.every(isOnrampFee) &&
        isAppkitOnrampServiceMetadata(value.providerMetadata)
    );
};

export const isAppkitOnrampGetQuoteResponse = (value: unknown): value is AppkitOnrampGetQuoteResponse => {
    if (!isObject(value)) return false;
    return Array.isArray(value.quotes) && value.quotes.every(isAppkitOnrampQuote) && isStringArray(value.providerIds);
};

export const isAppkitOnrampBuildUrlResponse = (value: unknown): value is AppkitOnrampBuildUrlResponse => {
    if (!isObject(value)) return false;
    return typeof value.url === 'string';
};
