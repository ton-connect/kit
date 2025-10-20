package io.ton.walletkit.domain.model

import io.ton.walletkit.domain.constants.JsonConstants
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Result of transaction emulation/preview.
 *
 * Mirrors the shared TON Wallet Kit model for cross-platform consistency.
 */
@Serializable
sealed class TONTransactionPreview {
    /**
     * Emulation failed with an error.
     *
     * @property emulationError The emulation error details
     */
    @Serializable
    @SerialName(JsonConstants.VALUE_PREVIEW_ERROR)
    data class Error(
        val emulationError: TONTransactionPreviewEmulationError,
    ) : TONTransactionPreview()

    /**
     * Emulation succeeded.
     *
     * @property emulationResult The emulation result with money flow
     */
    @Serializable
    @SerialName(JsonConstants.VALUE_PREVIEW_SUCCESS)
    data class Success(
        val emulationResult: TONTransactionPreviewEmulationResult,
    ) : TONTransactionPreview()
}

/**
 * Transaction preview emulation error.
 *
 * Mirrors the shared TON Wallet Kit model.
 *
 * @property emulationError The error details
 */
@Serializable
data class TONTransactionPreviewEmulationError(
    val emulationError: TONEmulationError,
)

/**
 * Transaction preview emulation result.
 *
 * Mirrors the shared TON Wallet Kit model.
 *
 * @property moneyFlow Money flow analysis
 * @property emulationResult Full emulation response from TON Center
 */
@Serializable
data class TONTransactionPreviewEmulationResult(
    val moneyFlow: TONMoneyFlow,
    val emulationResult: TONCenterEmulationResponse,
)

/**
 * TON Center emulation response.
 * Contains detailed transaction emulation data.
 *
 * Mirrors the shared TON Wallet Kit model.
 */
@Serializable
data class TONCenterEmulationResponse(
    val mcBlockSeqno: Int? = null,
    val trace: TONEmulationTraceNode? = null,
    val transactions: Map<String, TONCenterTransaction>? = null,
    val actions: List<TONEmulationAction>? = null,
    val codeCells: Map<String, String>? = null,
    val dataCells: Map<String, String>? = null,
    val addressBook: Map<String, TONEmulationAddressBookEntry>? = null,
    val metadata: Map<String, TONEmulationAddressMetadata>? = null,
    val randSeed: String? = null,
    val isIncomplete: Boolean? = null,
)

/**
 * Node in the emulation trace tree.
 */
@Serializable
data class TONEmulationTraceNode(
    val txHash: String? = null,
    val inMsgHash: String? = null,
    val children: List<TONEmulationTraceNode>? = null,
)

/**
 * Transaction details in emulation response.
 */
@Serializable
data class TONCenterTransaction(
    val account: String? = null,
    val hash: String? = null,
    val lt: String? = null,
    val now: Int? = null,
    val mcBlockSeqno: Int? = null,
    val traceExternalHash: String? = null,
    val prevTransHash: String? = null,
    val prevTransLt: String? = null,
    val origStatus: String? = null,
    val endStatus: String? = null,
    val totalFees: String? = null,
    val totalFeesExtraCurrencies: Map<String, String>? = null,
    val description: TONEmulationTransactionDescription? = null,
    val blockRef: TONEmulationBlockRef? = null,
    val inMsg: TONEmulationMessage? = null,
    val outMsgs: List<TONEmulationMessage>? = null,
    val accountStateBefore: TONEmulationAccountState? = null,
    val accountStateAfter: TONEmulationAccountState? = null,
    val emulated: Boolean? = null,
    val traceId: String? = null,
)

/**
 * Action in emulation response.
 */
@Serializable
data class TONEmulationAction(
    val type: String? = null,
    val status: String? = null,
    val tonTransfer: TONEmulationTonTransfer? = null,
    val jettonTransfer: TONEmulationJettonTransfer? = null,
    val nftItemTransfer: TONEmulationNftTransfer? = null,
)

/**
 * Address book entry in emulation.
 */
@Serializable
data class TONEmulationAddressBookEntry(
    val userFriendly: String? = null,
)

/**
 * Address metadata in emulation.
 */
@Serializable
data class TONEmulationAddressMetadata(
    val name: String? = null,
    val image: String? = null,
    val description: String? = null,
)

/**
 * Transaction description in emulation.
 */
@Serializable
data class TONEmulationTransactionDescription(
    val type: String? = null,
    val computePhase: TONEmulationComputePhase? = null,
    val actionPhase: TONEmulationActionPhase? = null,
    val storagePhase: TONEmulationStoragePhase? = null,
)

/**
 * Block reference in emulation.
 */
@Serializable
data class TONEmulationBlockRef(
    val workchain: Int? = null,
    val shard: String? = null,
    val seqno: Int? = null,
)

/**
 * Message in emulation.
 */
@Serializable
data class TONEmulationMessage(
    val msgType: String? = null,
    val createdLt: String? = null,
    val ihrDisabled: Boolean? = null,
    val bounce: Boolean? = null,
    val bounced: Boolean? = null,
    val value: String? = null,
    val fwdFee: String? = null,
    val ihrFee: String? = null,
    val destination: String? = null,
    val source: String? = null,
    val importFee: String? = null,
    val createdAt: Long? = null,
    val opCode: String? = null,
    val init: TONEmulationMessageInit? = null,
    val hash: String? = null,
    val body: String? = null,
    val bodyHash: String? = null,
)

/**
 * Account state in emulation.
 */
@Serializable
data class TONEmulationAccountState(
    val hash: String? = null,
    val balance: String? = null,
    val accountStatus: String? = null,
    val frozenHash: String? = null,
    val dataHash: String? = null,
    val codeHash: String? = null,
)

/**
 * TON transfer in action.
 */
@Serializable
data class TONEmulationTonTransfer(
    val sender: String? = null,
    val recipient: String? = null,
    val amount: String? = null,
    val comment: String? = null,
)

/**
 * Jetton transfer in action.
 */
@Serializable
data class TONEmulationJettonTransfer(
    val sender: String? = null,
    val recipient: String? = null,
    val sendersWallet: String? = null,
    val recipientsWallet: String? = null,
    val amount: String? = null,
    val comment: String? = null,
    val jetton: String? = null,
)

/**
 * NFT transfer in action.
 */
@Serializable
data class TONEmulationNftTransfer(
    val sender: String? = null,
    val recipient: String? = null,
    val nft: String? = null,
    val comment: String? = null,
)

/**
 * Compute phase in transaction description.
 */
@Serializable
data class TONEmulationComputePhase(
    val skipped: Boolean? = null,
    val success: Boolean? = null,
    val gasFees: String? = null,
    val gasUsed: String? = null,
    val vmSteps: Int? = null,
    val exitCode: Int? = null,
)

/**
 * Action phase in transaction description.
 */
@Serializable
data class TONEmulationActionPhase(
    val success: Boolean? = null,
    val totalActions: Int? = null,
    val skippedActions: Int? = null,
    val fwdFees: String? = null,
    val totalFees: String? = null,
    val resultCode: Int? = null,
)

/**
 * Storage phase in transaction description.
 */
@Serializable
data class TONEmulationStoragePhase(
    val storageFeesCollected: String? = null,
    val storageFeesDue: String? = null,
    val statusChange: String? = null,
)

/**
 * Message init in emulation.
 */
@Serializable
data class TONEmulationMessageInit(
    val splitDepth: Int? = null,
    val special: Boolean? = null,
)
