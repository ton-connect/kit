package io.ton.walletkit.engine

import io.ton.walletkit.model.WalletSigner
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.ConcurrentHashMap

/**
 * Manages external signer callbacks used by the JavaScript bridge.
 *
 * This registry keeps track of Kotlin-side [WalletSigner] instances that can be invoked by the
 * bridge when a dApp requests a signature. Each signer is assigned a unique ID that is passed to
 * the bridge and later used to locate the signer when a sign request is received.
 *
 * @suppress Internal component. Exposed via [WebViewWalletKitEngine] only.
 */
internal class SignerManager {
    private val signerCallbacks = ConcurrentHashMap<String, WalletSigner>()
    private val mutex = Mutex()

    /**
     * Register a signer instance and obtain a unique ID that can be shared with the bridge.
     *
     * The ID format matches the legacy implementation to guarantee interoperability with
     * persisted bridge state.
     */
    suspend fun registerSigner(signer: WalletSigner): String = mutex.withLock {
        val signerId = buildString {
            append("signer_")
            append(System.currentTimeMillis())
            append('_')
            append((Math.random() * 1_000_000).toInt())
        }
        signerCallbacks[signerId] = signer
        signerId
    }

    /**
     * Look up a signer by ID.
     */
    fun getSigner(signerId: String): WalletSigner? = signerCallbacks[signerId]

    /**
     * Remove a signer from the registry.
     */
    suspend fun removeSigner(signerId: String) {
        mutex.withLock {
            signerCallbacks.remove(signerId)
        }
    }

    /**
     * Expose current signer IDs for debugging.
     */
    fun currentSignerIds(): Set<String> = signerCallbacks.keys
}
