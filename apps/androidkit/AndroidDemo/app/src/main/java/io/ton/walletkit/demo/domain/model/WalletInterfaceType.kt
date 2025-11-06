package io.ton.walletkit.demo.domain.model

/**
 * Wallet interface type determines how the wallet handles signing operations.
 */
enum class WalletInterfaceType(val value: String) {
    /**
     * Standard mnemonic-based wallet that automatically handles signing.
     */
    MNEMONIC("mnemonic"),

    /**
     * Secret key (private key) based wallet that automatically handles signing.
     */
    SECRET_KEY("secretKey"),

    /**
     * Custom signer wallet that requires user confirmation for each signing operation.
     */
    SIGNER("signer"),
    ;

    companion object {
        fun fromValue(value: String): WalletInterfaceType = entries.find { it.value == value } ?: MNEMONIC
    }
}
