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
     * Method name for creating a V5R1 wallet adapter from mnemonic.
     * Matches JS API: createV5R1WalletUsingMnemonic()
     */
    const val METHOD_CREATE_V5R1_WALLET_USING_MNEMONIC = "createV5R1WalletUsingMnemonic"

    /**
     * Method name for creating a V4R2 wallet adapter from mnemonic.
     * Matches JS API: createV4R2WalletUsingMnemonic()
     */
    const val METHOD_CREATE_V4R2_WALLET_USING_MNEMONIC = "createV4R2WalletUsingMnemonic"

    /**
     * Method name for adding a wallet adapter to the kit.
     * Matches JS API: walletKit.addWallet(adapter)
     */
    const val METHOD_ADD_WALLET = "addWallet"

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
     * Method name for creating a TON transfer transaction.
     * Matches JS API: wallet.createTransferTonTransaction()
     */
    const val METHOD_CREATE_TRANSFER_TON_TRANSACTION = "createTransferTonTransaction"

    /**
     * Method name for handling a new transaction.
     * Matches JS API: kit.handleNewTransaction()
     */
    const val METHOD_HANDLE_NEW_TRANSACTION = "handleNewTransaction"

    /**
     * Method name for sending a transaction to the blockchain.
     * This sends arbitrary transaction content (created by transferNFT, etc.)
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

    /**
     * Method name for deriving public key from mnemonic.
     */
    const val METHOD_DERIVE_PUBLIC_KEY_FROM_MNEMONIC = "derivePublicKeyFromMnemonic"

    /**
     * Method name for signing arbitrary data with a mnemonic using the JS bundle.
     */
    const val METHOD_SIGN_DATA_WITH_MNEMONIC = "signDataWithMnemonic"

    /**
     * Method name for adding a wallet backed by an external signer.
     */
    const val METHOD_ADD_WALLET_WITH_SIGNER = "addWalletWithSigner"

    /**
     * Method name for responding to a sign request.
     */
    const val METHOD_RESPOND_TO_SIGN_REQUEST = "respondToSignRequest"

    /**
     * Method name for generating a new TON mnemonic via the JS bundle.
     */
    const val METHOD_CREATE_TON_MNEMONIC = "createTonMnemonic"

    /**
     * Method name for processing an internal browser TonConnect request.
     */
    const val METHOD_PROCESS_INTERNAL_BROWSER_REQUEST = "processInternalBrowserRequest"

    /**
     * Method name for emitting a browser page started event to JavaScript.
     */
    const val METHOD_EMIT_BROWSER_PAGE_STARTED = "emitBrowserPageStarted"

    /**
     * Method name for emitting a browser page finished event to JavaScript.
     */
    const val METHOD_EMIT_BROWSER_PAGE_FINISHED = "emitBrowserPageFinished"

    /**
     * Method name for emitting a browser error event to JavaScript.
     */
    const val METHOD_EMIT_BROWSER_ERROR = "emitBrowserError"

    /**
     * Method name for emitting a browser bridge request diagnostic event.
     */
    const val METHOD_EMIT_BROWSER_BRIDGE_REQUEST = "emitBrowserBridgeRequest"

    /**
     * Method name for getting NFTs owned by a wallet.
     */
    const val METHOD_GET_NFTS = "getNfts"

    /**
     * Method name for getting a single NFT by address.
     */
    const val METHOD_GET_NFT = "getNft"

    /**
     * Method name for creating an NFT transfer transaction with human-friendly parameters.
     */
    const val METHOD_CREATE_TRANSFER_NFT_TRANSACTION = "createTransferNftTransaction"

    /**
     * Method name for creating an NFT transfer transaction with raw parameters.
     */
    const val METHOD_CREATE_TRANSFER_NFT_RAW_TRANSACTION = "createTransferNftRawTransaction"

    /**
     * Method name for getting jettons owned by a wallet.
     */
    const val METHOD_GET_JETTONS = "getJettons"

    /**
     * Method name for getting a single jetton by address.
     */
    const val METHOD_GET_JETTON = "getJetton"

    /**
     * Method name for creating a jetton transfer transaction.
     */
    const val METHOD_CREATE_TRANSFER_JETTON_TRANSACTION = "createTransferJettonTransaction"

    /**
     * Method name for getting jetton balance for a wallet.
     */
    const val METHOD_GET_JETTON_BALANCE = "getJettonBalance"

    /**
     * Method name for getting jetton wallet address.
     */
    const val METHOD_GET_JETTON_WALLET_ADDRESS = "getJettonWalletAddress"
}
