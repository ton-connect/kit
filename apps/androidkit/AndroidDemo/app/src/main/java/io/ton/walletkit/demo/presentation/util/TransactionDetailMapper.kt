package io.ton.walletkit.demo.presentation.util

import io.ton.walletkit.demo.presentation.model.TransactionDetailUi
import io.ton.walletkit.model.Transaction
import io.ton.walletkit.model.TransactionType

/**
 * Mapper for converting domain Transaction objects to UI models.
 */
object TransactionDetailMapper {

    /**
     * Parse a domain Transaction into a TransactionDetailUi for display.
     *
     * @param tx The transaction to parse
     * @param walletAddress The wallet address (used for inferring sender/recipient)
     * @param unknownAddressLabel Label to use for unknown addresses
     * @param defaultFeeLabel Label to use when fee is unavailable
     * @param successStatusLabel Status label for successful transactions
     *
     * @return TransactionDetailUi ready for display
     */
    fun toDetailUi(
        tx: Transaction,
        walletAddress: String,
        unknownAddressLabel: String,
        defaultFeeLabel: String,
        successStatusLabel: String,
    ): TransactionDetailUi {
        val isOutgoing = tx.type == TransactionType.OUTGOING

        return TransactionDetailUi(
            hash = tx.hash,
            timestamp = tx.timestamp,
            amount = TonFormatter.formatNanoTon(tx.amount),
            fee = tx.fee?.let { TonFormatter.formatNanoTon(it) } ?: defaultFeeLabel,
            fromAddress = tx.sender ?: (if (isOutgoing) walletAddress else unknownAddressLabel),
            toAddress = tx.recipient ?: (if (!isOutgoing) walletAddress else unknownAddressLabel),
            comment = tx.comment,
            status = successStatusLabel, // Transactions from bridge are already filtered/successful
            lt = tx.lt ?: "0",
            blockSeqno = tx.blockSeqno ?: 0,
            isOutgoing = isOutgoing,
        )
    }
}
