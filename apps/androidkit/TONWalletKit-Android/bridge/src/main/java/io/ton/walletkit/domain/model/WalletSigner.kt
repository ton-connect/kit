package io.ton.walletkit.domain.model

/**
 * Interface for external wallet signers.
 *
 * A WalletSigner allows you to create wallets where the private key is managed externally
 * (e.g., hardware wallet, separate secure module, watch-only wallet).
 *
 * The wallet will call [sign] whenever a transaction or data needs to be signed.
 *
 * Example:
 * ```kotlin
 * val signer = object : WalletSigner {
 *     override val publicKey: String = "abc123..." // hex encoded public key
 *
 *     override suspend fun sign(data: ByteArray): ByteArray {
 *         // Show user confirmation dialog
 *         // Call hardware wallet or external signing service
 *         return signature
 *     }
 * }
 *
 * val wallet = TONWallet.addWithSigner(
 *     signer = signer,
 *     version = "v4r2",
 *     network = TONNetwork.MAINNET
 * )
 * ```
 */
interface WalletSigner {
    /**
     * The public key of the wallet in hex format.
     * This is used to derive the wallet address.
     */
    val publicKey: String

    /**
     * Sign the given data.
     *
     * This method will be called whenever the wallet needs to sign a transaction or data.
     * Implementations should:
     * 1. Show user confirmation UI if needed
     * 2. Call the external signing service (hardware wallet, etc.)
     * 3. Return the signature bytes
     *
     * @param data The data to sign
     * @return The signature bytes
     * @throws Exception if signing fails or user cancels
     */
    suspend fun sign(data: ByteArray): ByteArray
}
