package io.ton.walletkit.model

/**
 * Interface for external wallet signers.
 *
 * A WalletSigner allows you to create wallets where the private key is managed externally,
 * such as:
 * - Watch-only wallets (keys stored on another device/service)
 * - Multi-signature coordinators
 * - Remote signing services with custom authorization
 * - Separate secure modules
 *
 * The wallet will call [sign] whenever a transaction or data needs to be signed.
 *
 * **IMPORTANT: Hardware Wallet Limitation**
 * This interface is NOT suitable for hardware wallets like Ledger or Trezor because:
 * - They only sign complete transactions (not arbitrary data)
 * - They work at transaction-level, not raw bytes level
 * - They cannot sign arbitrary payloads from TonConnect signData requests
 *
 * For hardware wallets, implement transaction-only signing at the wallet adapter level instead.
 *
 * Example:
 * ```kotlin
 * val signer = object : WalletSigner {
 *     override val publicKey: String = "abc123..." // hex encoded public key
 *
 *     override suspend fun sign(data: ByteArray): ByteArray {
 *         // Show user confirmation dialog
 *         // Call remote signing service or external signer
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
