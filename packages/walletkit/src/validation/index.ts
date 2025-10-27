/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Validation module exports

export type { ValidationResult, ValidationRule, ValidationContext, FieldValidationError } from './types';

export { validateWallet, validatePublicKey, validateWalletVersion, validateWalletMethods } from './wallet';

export {
    validateBridgeEvent,
    validateConnectEventParams,
    validateTransactionEventParams,
    validateSignDataEventParams,
} from './events';

export {
    validateTonAddress,
    validateRawAddress,
    validateBouncableAddress,
    validateNonBouncableAddress,
    detectAddressFormat,
    detectAddressNetwork,
} from './address';

export {
    validateTransactionMessages,
    validateTransactionMessage,
    validateMessageObject,
    validateTransactionRequest,
    validateBOC,
    isValidNanotonAmount,
    estimateTransactionFees,
} from './transaction';

export type { HumanReadableTx } from './transaction';
