package io.ton.walletkit.domain.model

import kotlinx.serialization.Serializable

/**
 * Jetton verification information.
 *
 * @property verified Whether the jetton is verified
 * @property source Verification source
 * @property warnings List of warnings about the jetton
 */
@Serializable
data class TONJettonVerification(
    val verified: Boolean? = null,
    val source: Source? = null,
    val warnings: List<String>? = null,
) {
    /**
     * Verification source types.
     */
    @Serializable
    enum class Source {
        @kotlinx.serialization.SerialName("toncenter")
        TONCENTER,

        @kotlinx.serialization.SerialName("community")
        COMMUNITY,

        @kotlinx.serialization.SerialName("manual")
        MANUAL,
    }
}
