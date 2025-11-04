package io.ton.walletkit.internal.constants

/**
 * JSON constants used for @SerialName annotations in the API module.
 * These must match the values in impl module's JsonConstants.
 */
internal object JsonConstants {
    const val KEY_VALID_UNTIL = "valid_until"
    const val VALUE_SIGN_DATA_TEXT = "text"
    const val VALUE_SIGN_DATA_BINARY = "binary"
    const val VALUE_SIGN_DATA_CELL = "cell"
    const val VALUE_ASSET_TON = "ton"
    const val VALUE_ASSET_JETTON = "jetton"
    const val VALUE_PREVIEW_ERROR = "error"
    const val VALUE_PREVIEW_SUCCESS = "success"
}
