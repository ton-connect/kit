package io.ton.walletkit.domain.constants

/**
 * Constants for JavaScript bridge method names.
 *
 * These constants define the method names used when calling JavaScript functions
 * in the WebView-based WalletKit engine. Centralizing these names ensures consistency
 * and makes refactoring easier.
 *
 * @suppress Internal implementation constants. Not part of public API.
 */
internal object BridgeMethodConstants {
    /**
     * Method name for initializing the WalletKit bridge.
     */
    const val METHOD_INIT = "init"

    /**
     * Method name for setting up event listeners.
     */
    const val METHOD_SET_EVENTS_LISTENERS = "setEventsListeners"

    /**
     * Method name for removing event listeners.
     */
    const val METHOD_REMOVE_EVENT_LISTENERS = "removeEventListeners"

    /**
     * Method name for adding a wallet from mnemonic phrase.
     */
    const val METHOD_ADD_WALLET_FROM_MNEMONIC = "addWalletFromMnemonic"

    /**
     * Method name for getting all wallets.
     */
    const val METHOD_GET_WALLETS = "getWallets"

    /**
     * Method name for removing a wallet.
     */
    const val METHOD_REMOVE_WALLET = "removeWallet"

    /**
     * Method name for getting wallet state (balance, transactions).
     */
    const val METHOD_GET_WALLET_STATE = "getWalletState"

    /**
     * Method name for getting recent transactions.
     */
    const val METHOD_GET_RECENT_TRANSACTIONS = "getRecentTransactions"

    /**
     * Method name for handling TON Connect URL.
     */
    const val METHOD_HANDLE_TON_CONNECT_URL = "handleTonConnectUrl"

    /**
     * Method name for sending a transaction.
     */
    const val METHOD_SEND_TRANSACTION = "sendTransaction"

    /**
     * Method name for approving a connect request.
     */
    const val METHOD_APPROVE_CONNECT_REQUEST = "approveConnectRequest"

    /**
     * Method name for rejecting a connect request.
     */
    const val METHOD_REJECT_CONNECT_REQUEST = "rejectConnectRequest"

    /**
     * Method name for approving a transaction request.
     */
    const val METHOD_APPROVE_TRANSACTION_REQUEST = "approveTransactionRequest"

    /**
     * Method name for rejecting a transaction request.
     */
    const val METHOD_REJECT_TRANSACTION_REQUEST = "rejectTransactionRequest"

    /**
     * Method name for approving a sign data request.
     */
    const val METHOD_APPROVE_SIGN_DATA_REQUEST = "approveSignDataRequest"

    /**
     * Method name for rejecting a sign data request.
     */
    const val METHOD_REJECT_SIGN_DATA_REQUEST = "rejectSignDataRequest"

    /**
     * Method name for listing all active sessions.
     */
    const val METHOD_LIST_SESSIONS = "listSessions"

    /**
     * Method name for disconnecting a session.
     */
    const val METHOD_DISCONNECT_SESSION = "disconnectSession"
}
