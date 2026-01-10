/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    BridgeClientConnectErrorEvent,
    BridgeClientConnectStartedEvent,
    BridgeClientMessageDecodeErrorEvent,
    BridgeClientMessageReceivedEvent,
    BridgeConnectEstablishedEvent,
    BridgeEventsClientSubscribedEvent,
    BridgeEventsClientUnsubscribedEvent,
    BridgeMessageExpiredEvent,
    BridgeMessageReceivedEvent,
    BridgeMessageSentEvent,
    BridgeMessageValidationFailedEvent,
    BridgeRequestSentEvent,
    BridgeVerifyEvent,
    BridgeVerifyValidationFailedEvent,
    ConnectionCompletedEvent,
    ConnectionErrorEvent,
    ConnectionSelectedWalletEvent,
    ConnectionStartedEvent,
    DisconnectionEvent,
    JSBridgeCallEvent,
    JSBridgeErrorEvent,
    JSBridgeResponseEvent,
    SignDataRequestCompletedEvent,
    SignDataRequestFailedEvent,
    SignDataRequestInitiatedEvent,
    TONConnectEvent,
    TransactionSentEvent,
    TransactionSignedEvent,
    TransactionSigningFailedEvent,
    WalletConnectAcceptedEvent,
    WalletConnectRejectedEvent,
    WalletConnectRequestReceivedEvent,
    WalletConnectRequestUIDisplayedEvent,
    WalletConnectResponseSentEvent,
    WalletSignDataAcceptedEvent,
    WalletSignDataConfirmationUIDisplayedEvent,
    WalletSignDataDeclinedEvent,
    WalletSignDataRequestReceivedEvent,
    WalletSignDataSentEvent,
    WalletTransactionAcceptedEvent,
    WalletTransactionConfirmationUIDisplayedEvent,
    WalletTransactionDeclinedEvent,
    WalletTransactionRequestReceivedEvent,
    WalletTransactionSentEvent,
} from './generated';

export type AnalyticsEvent =
    | BridgeClientConnectErrorEvent
    | BridgeClientConnectStartedEvent
    | BridgeClientMessageDecodeErrorEvent
    | BridgeClientMessageReceivedEvent
    | BridgeConnectEstablishedEvent
    | BridgeEventsClientSubscribedEvent
    | BridgeEventsClientUnsubscribedEvent
    | BridgeMessageExpiredEvent
    | BridgeMessageReceivedEvent
    | BridgeMessageSentEvent
    | BridgeMessageValidationFailedEvent
    | BridgeRequestSentEvent
    | BridgeVerifyEvent
    | BridgeVerifyValidationFailedEvent
    | ConnectionCompletedEvent
    | ConnectionErrorEvent
    | ConnectionSelectedWalletEvent
    | ConnectionStartedEvent
    | DisconnectionEvent
    | JSBridgeCallEvent
    | JSBridgeErrorEvent
    | JSBridgeResponseEvent
    | SignDataRequestCompletedEvent
    | SignDataRequestFailedEvent
    | SignDataRequestInitiatedEvent
    | TONConnectEvent
    | TransactionSentEvent
    | TransactionSignedEvent
    | TransactionSigningFailedEvent
    | WalletConnectAcceptedEvent
    | WalletConnectRejectedEvent
    | WalletConnectRequestReceivedEvent
    | WalletConnectRequestUIDisplayedEvent
    | WalletConnectResponseSentEvent
    | WalletSignDataAcceptedEvent
    | WalletSignDataConfirmationUIDisplayedEvent
    | WalletSignDataDeclinedEvent
    | WalletSignDataRequestReceivedEvent
    | WalletSignDataSentEvent
    | WalletTransactionAcceptedEvent
    | WalletTransactionConfirmationUIDisplayedEvent
    | WalletTransactionDeclinedEvent
    | WalletTransactionRequestReceivedEvent
    | WalletTransactionSentEvent;

export type {
    BridgeClientConnectErrorEvent,
    BridgeClientConnectStartedEvent,
    BridgeClientMessageDecodeErrorEvent,
    BridgeClientMessageReceivedEvent,
    BridgeConnectEstablishedEvent,
    BridgeEventsClientSubscribedEvent,
    BridgeEventsClientUnsubscribedEvent,
    BridgeMessageExpiredEvent,
    BridgeMessageReceivedEvent,
    BridgeMessageSentEvent,
    BridgeMessageValidationFailedEvent,
    BridgeRequestSentEvent,
    BridgeVerifyEvent,
    BridgeVerifyValidationFailedEvent,
    ConnectionCompletedEvent,
    ConnectionErrorEvent,
    ConnectionSelectedWalletEvent,
    ConnectionStartedEvent,
    DisconnectionEvent,
    JSBridgeCallEvent,
    JSBridgeErrorEvent,
    JSBridgeResponseEvent,
    SignDataRequestCompletedEvent,
    SignDataRequestFailedEvent,
    SignDataRequestInitiatedEvent,
    TONConnectEvent,
    TransactionSentEvent,
    TransactionSignedEvent,
    TransactionSigningFailedEvent,
    WalletConnectAcceptedEvent,
    WalletConnectRejectedEvent,
    WalletConnectRequestReceivedEvent,
    WalletConnectRequestUIDisplayedEvent,
    WalletConnectResponseSentEvent,
    WalletSignDataAcceptedEvent,
    WalletSignDataConfirmationUIDisplayedEvent,
    WalletSignDataDeclinedEvent,
    WalletSignDataRequestReceivedEvent,
    WalletSignDataSentEvent,
    WalletTransactionAcceptedEvent,
    WalletTransactionConfirmationUIDisplayedEvent,
    WalletTransactionDeclinedEvent,
    WalletTransactionRequestReceivedEvent,
    WalletTransactionSentEvent,
} from './generated';
