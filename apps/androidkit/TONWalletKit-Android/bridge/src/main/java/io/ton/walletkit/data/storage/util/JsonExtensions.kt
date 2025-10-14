package io.ton.walletkit.data.storage.util

import io.ton.walletkit.data.model.StoredSessionHint
import io.ton.walletkit.data.model.StoredWalletRecord
import io.ton.walletkit.domain.constants.JsonConstants
import org.json.JSONArray
import org.json.JSONObject

fun String.toStoredWalletRecord(): StoredWalletRecord? = runCatching {
    val json = JSONObject(this)
    val wordsArray = json.optJSONArray(JsonConstants.KEY_WORDS) ?: return null
    val words = List(wordsArray.length()) { index -> wordsArray.optString(index) }
    StoredWalletRecord(
        mnemonic = words,
        name = json.stringOrNull(JsonConstants.KEY_NAME),
        network = json.stringOrNull(JsonConstants.KEY_NETWORK),
        version = json.stringOrNull(JsonConstants.KEY_VERSION),
    )
}.getOrNull()

fun JSONObject.stringOrNull(key: String): String? {
    if (!has(key) || isNull(key)) return null
    return optString(key)
}

fun StoredWalletRecord.toJson(): JSONObject = JSONObject().apply {
    put(JsonConstants.KEY_WORDS, JSONArray(mnemonic))
    name?.let { put(JsonConstants.KEY_NAME, it) }
    network?.let { put(JsonConstants.KEY_NETWORK, it) }
    version?.let { put(JsonConstants.KEY_VERSION, it) }
}

fun StoredSessionHint.toJson(): JSONObject = JSONObject().apply {
    manifestUrl?.let { put(JsonConstants.KEY_MANIFEST_URL, it) }
    dAppUrl?.let { put(JsonConstants.KEY_DAPP_URL, it) }
    iconUrl?.let { put(JsonConstants.KEY_ICON_URL, it) }
}
