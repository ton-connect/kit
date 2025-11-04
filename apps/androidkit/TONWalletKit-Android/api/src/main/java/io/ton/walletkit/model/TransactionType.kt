package io.ton.walletkit.model

/**
 * Categorizes the direction and nature of a blockchain transaction.
 *
 * This enum helps determine how a transaction should be displayed
 * in the user interface and how amounts should be formatted.
 */
enum class TransactionType {
    /**
     * Transaction where the wallet receives funds from another address.
     * Amount should typically be displayed with a positive indicator.
     */
    INCOMING,

    /**
     * Transaction where the wallet sends funds to another address.
     * Amount should typically be displayed with a negative indicator.
     */
    OUTGOING,

    /**
     * Transaction type could not be determined.
     * This may occur for complex contract interactions or parsing errors.
     */
    UNKNOWN,
}
