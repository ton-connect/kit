/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// export * from './widgets/fiat-onramp/onramp-widget';  // fiat-onramp: not ready

export * from './widgets/crypto-onramp/crypto-onramp-widget';
export * from './widgets/crypto-onramp/crypto-onramp-widget-ui';
export * from './widgets/crypto-onramp/crypto-onramp-widget-provider';
export * from './widgets/ton-pay-widget';

export {
    useCryptoOnrampQuote,
    type UseCryptoOnrampQuoteParameters,
    type UseCryptoOnrampQuoteReturnType,
} from './hooks/use-crypto-onramp-quote';
export {
    useCreateCryptoOnrampDeposit,
    type UseCreateCryptoOnrampDepositParameters,
    type UseCreateCryptoOnrampDepositReturnType,
} from './hooks/use-create-crypto-onramp-deposit';
export {
    useCryptoOnrampStatus,
    type UseCryptoOnrampStatusParameters,
    type UseCryptoOnrampStatusReturnType,
} from './hooks/use-crypto-onramp-status';

export * from './types';
