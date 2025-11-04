package io.ton.walletkit.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

/**
 * Jetton wallet information.
 *
 * Represents a user's jetton wallet contract that holds jetton tokens.
 *
 * @property address Jetton wallet contract address
 * @property balance Balance of jettons in this wallet
 * @property owner Owner wallet address
 * @property jetton Jetton information (populated separately via workaround)
 * @property jettonAddress Jetton master contract address
 * @property lastTransactionLt Last transaction logical time
 * @property codeHash Code hash of the jetton wallet contract
 * @property dataHash Data hash of the jetton wallet contract
 */
@Serializable
data class TONJettonWallet(
    val address: String,
    val balance: String? = null,
    val owner: String? = null,
    // TODO: Remove this hack after JettonInfo is added into JettonWallet on JS side
    @Transient
    var jetton: TONJetton? = null,
    @SerialName("jetton")
    val jettonAddress: String? = null,
    @SerialName("last_transaction_lt")
    val lastTransactionLt: String? = null,
    @SerialName("code_hash")
    val codeHash: String? = null,
    @SerialName("data_hash")
    val dataHash: String? = null,
)
