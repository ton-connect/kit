package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Parameters for creating a TON transfer transaction.
 *
 * Matches the TypeScript TonTransferParams interface from the JS WalletKit API:
 * ```typescript
 * type TonTransferParams = {
 *   toAddress: string;
 *   amount: string;
 *   body?: string;     // base64 BOC
 *   comment?: string;
 *   stateInit?: string; // base64 BOC
 *   extraCurrency?: ConnectExtraCurrency;
 *   mode?: SendMode;
 * }
 * ```
 *
 * @property toAddress Recipient address
 * @property amount Amount in nanoTON as a string
 * @property comment Optional comment/memo text (mutually exclusive with body)
 * @property body Optional raw cell payload as base64 BOC (mutually exclusive with comment)
 * @property stateInit Optional state init as base64 BOC
 */
@Serializable
data class TONTransferParams(
    val toAddress: String,
    val amount: String,
    val comment: String? = null,
    val body: String? = null,
    val stateInit: String? = null,
) {
    init {
        require(toAddress.isNotBlank()) { "toAddress cannot be blank" }
        require(amount.isNotBlank()) { "amount cannot be blank" }
        // Ensure only one of comment or body is set
        require(comment == null || body == null) {
            "Only one of 'comment' or 'body' can be specified, not both"
        }
    }
}
