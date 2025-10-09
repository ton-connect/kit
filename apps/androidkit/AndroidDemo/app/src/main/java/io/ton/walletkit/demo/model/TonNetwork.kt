package io.ton.walletkit.demo.model

enum class TonNetwork {
    MAINNET,
    TESTNET,
    ;

    fun asBridgeValue(): String = when (this) {
        MAINNET -> "mainnet"
        TESTNET -> "testnet"
    }

    companion object {
        fun fromBridge(value: String?, fallback: TonNetwork = MAINNET): TonNetwork {
            val normalized = value?.trim()?.lowercase()
            return when (normalized) {
                "mainnet" -> MAINNET
                "testnet" -> TESTNET
                else -> fallback
            }
        }
    }
}
