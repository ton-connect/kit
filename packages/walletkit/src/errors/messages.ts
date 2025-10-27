/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ERROR_CODES } from './codes';

export const ERROR_MESSAGES: Record<number, string> = {
    // Bridge Manager Errors (7000-7099)
    [ERROR_CODES.BRIDGE_NOT_INITIALIZED]: 'Bridge not initialized',
    [ERROR_CODES.BRIDGE_CONNECTION_FAILED]: 'Bridge connection failed',
    [ERROR_CODES.BRIDGE_EVENT_PROCESSING_FAILED]: 'Bridge event processing failed',
    [ERROR_CODES.BRIDGE_RESPONSE_SEND_FAILED]: 'Bridge response send failed',

    // Session Errors (7100-7199)
    [ERROR_CODES.SESSION_NOT_FOUND]: 'Session not found',
    [ERROR_CODES.SESSION_ID_REQUIRED]: 'Session ID required',
    [ERROR_CODES.SESSION_CREATION_FAILED]: 'Session creation failed',
    [ERROR_CODES.SESSION_DOMAIN_REQUIRED]: 'Session domain required',
    [ERROR_CODES.SESSION_RESTORATION_FAILED]: 'Session restoration failed',

    // Event Store Errors (7200-7299)
    [ERROR_CODES.EVENT_STORE_NOT_INITIALIZED]: 'Event store not initialized',
    [ERROR_CODES.EVENT_STORE_OPERATION_FAILED]: 'Event store operation failed',

    // Storage Errors (7300-7399)
    [ERROR_CODES.STORAGE_READ_FAILED]: 'Storage read failed',
    [ERROR_CODES.STORAGE_WRITE_FAILED]: 'Storage write failed',

    // Wallet Errors (7400-7499)
    [ERROR_CODES.WALLET_NOT_FOUND]: 'Wallet not found',
    [ERROR_CODES.WALLET_REQUIRED]: 'Wallet required',
    [ERROR_CODES.WALLET_INVALID]: 'Wallet invalid',
    [ERROR_CODES.WALLET_CREATION_FAILED]: 'Wallet creation failed',
    [ERROR_CODES.WALLET_INITIALIZATION_FAILED]: 'Wallet initialization failed',
    [ERROR_CODES.LEDGER_DEVICE_ERROR]: 'Ledger device error',

    // Request Processing Errors (7500-7599)
    [ERROR_CODES.INVALID_REQUEST_EVENT]: 'Invalid request event',
    [ERROR_CODES.REQUEST_PROCESSING_FAILED]: 'Request processing failed',
    [ERROR_CODES.RESPONSE_CREATION_FAILED]: 'Response creation failed',
    [ERROR_CODES.APPROVAL_FAILED]: 'Approval failed',
    [ERROR_CODES.REJECTION_FAILED]: 'Rejection failed',

    // API Client Errors (7600-7699)
    [ERROR_CODES.API_CLIENT_ERROR]: 'Api client error',
    [ERROR_CODES.TON_CLIENT_INITIALIZATION_FAILED]: 'Ton client initialization failed',
    [ERROR_CODES.API_REQUEST_FAILED]: 'Api request failed',
    [ERROR_CODES.ACCOUNT_NOT_FOUND]: 'Account not found',

    // Jetton/NFT Errors (7700-7799)
    [ERROR_CODES.JETTONS_MANAGER_ERROR]: 'Jetton manager error',
    [ERROR_CODES.NFT_MANAGER_ERROR]: 'NFT manager error',

    // Contract Errors (7800-7899)
    [ERROR_CODES.CONTRACT_DEPLOYMENT_FAILED]: 'Contract deployment failed',
    [ERROR_CODES.CONTRACT_EXECUTION_FAILED]: 'Contract execution failed',
    [ERROR_CODES.CONTRACT_VALIDATION_FAILED]: 'Contract validation failed',

    // Generic Errors (7900-7999)
    [ERROR_CODES.UNKNOWN_ERROR]: 'Unknown error',
    [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
    [ERROR_CODES.INITIALIZATION_ERROR]: 'Initialization error',
    [ERROR_CODES.CONFIGURATION_ERROR]: 'Configuration error',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error',
    [ERROR_CODES.UNKNOWN_EMULATION_ERROR]: 'Unknown emulation error',
};
