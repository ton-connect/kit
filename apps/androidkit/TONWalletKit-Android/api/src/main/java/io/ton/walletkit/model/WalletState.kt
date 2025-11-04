package io.ton.walletkit.model

/**
 * Current state of a wallet.
 *
 * @property balance Wallet balance in nanoTON, null if not yet fetched
 * @property transactions Recent transactions for this wallet
 */
data class WalletState(
    val balance: String?,
    val transactions: List<Transaction> = emptyList(),
)
