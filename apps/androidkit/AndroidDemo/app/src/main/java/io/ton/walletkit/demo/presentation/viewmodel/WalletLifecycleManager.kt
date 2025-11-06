package io.ton.walletkit.demo.presentation.viewmodel

import android.util.Log
import io.ton.walletkit.ITONWallet
import io.ton.walletkit.ITONWalletKit
import io.ton.walletkit.demo.data.cache.TransactionCache
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.UserPreferences
import io.ton.walletkit.demo.data.storage.WalletRecord
import io.ton.walletkit.demo.domain.model.PendingWalletRecord
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.domain.model.WalletMetadata
import io.ton.walletkit.demo.domain.model.toBridgeValue
import io.ton.walletkit.demo.domain.model.toTonNetwork
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.util.TonFormatter
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONWalletData

/**
 * Handles wallet lifecycle: bootstrapping from storage, metadata management,
 * and producing [WalletSummary] items for UI consumption.
 */
class WalletLifecycleManager(
    private val storage: DemoAppStorage,
    private val defaultWalletVersion: String,
    private val defaultWalletNameProvider: (Int) -> String,
    private val kitProvider: suspend () -> ITONWalletKit,
    initialNetwork: TONNetwork,
) {

    data class BootstrapResult(
        val savedActiveWallet: String?,
    )

    val tonWallets: MutableMap<String, ITONWallet> = mutableMapOf()
    val walletMetadata: MutableMap<String, WalletMetadata> = mutableMapOf()
    val pendingWallets: ArrayDeque<PendingWalletRecord> = ArrayDeque()
    val transactionCache: TransactionCache = TransactionCache()

    var currentNetwork: TONNetwork = initialNetwork
        private set

    var lastPersistedActiveWallet: String? = null
        private set

    suspend fun bootstrap(): Result<BootstrapResult> = runCatching {
        val userPrefs = storage.loadUserPreferences()
        lastPersistedActiveWallet = userPrefs?.activeWalletAddress

        val kit = kitProvider()
        val wallets = kit.getWallets()
        tonWallets.clear()
        wallets.forEach { wallet ->
            wallet.address?.let { tonWallets[it] = wallet }
        }

        if (tonWallets.isEmpty()) {
            rehydrateWalletsFromStorage()
        }

        val walletsAfterMigration = kit.getWallets()
        tonWallets.clear()
        val metadataCorrections = mutableListOf<String>()
        for (wallet in walletsAfterMigration) {
            val address = wallet.address ?: continue
            tonWallets[address] = wallet
            if (walletMetadata[address] == null) {
                val storedRecord = storage.loadWallet(address)
                if (storedRecord != null) {
                    walletMetadata[address] = WalletMetadata(
                        name = storedRecord.name,
                        network = storedRecord.network.toTonNetwork(currentNetwork),
                        version = storedRecord.version,
                    )
                } else {
                    walletMetadata[address] = WalletMetadata(
                        name = defaultWalletNameProvider(walletMetadata.size),
                        network = currentNetwork,
                        version = defaultWalletVersion,
                    )
                    metadataCorrections.add(address)
                }
            }
        }
        if (metadataCorrections.isNotEmpty()) {
            Log.w(
                LOG_TAG,
                "No stored metadata for restored wallets: ${metadataCorrections.joinToString()} (fallback metadata applied)",
            )
        }

        BootstrapResult(savedActiveWallet = lastPersistedActiveWallet)
    }

    suspend fun loadWalletSummaries(sessions: List<SessionSummary>): List<WalletSummary> {
        val kit = kitProvider()
        val wallets = kit.getWallets()
        tonWallets.clear()
        wallets.forEach { wallet ->
            wallet.address?.let { tonWallets[it] = wallet }
        }

        val knownAddresses = wallets.mapNotNull { it.address }.toSet()
        walletMetadata.keys.retainAll(knownAddresses)

        val result = mutableListOf<WalletSummary>()
        for (wallet in wallets) {
            val address = wallet.address ?: continue
            val publicKey = wallet.publicKey
            val metadata = ensureMetadataForAddress(address)

            val balance = runCatching { wallet.getBalance() }
                .onFailure { Log.e(LOG_TAG, "loadWalletSummaries: balance failed for $address", it) }
                .getOrNull()
            val formattedBalance = balance?.let { TonFormatter.formatTon(it) }

            val cachedTransactions = transactionCache.get(address)
            val walletSessions = sessions.filter { it.walletAddress == address }

            val storedRecord = storage.loadWallet(address)
            val createdAt = storedRecord?.createdAt
            val interfaceType = storedRecord?.interfaceType?.let { io.ton.walletkit.demo.domain.model.WalletInterfaceType.fromValue(it) }
                ?: io.ton.walletkit.demo.domain.model.WalletInterfaceType.MNEMONIC

            result.add(
                WalletSummary(
                    address = address,
                    name = metadata.name,
                    network = metadata.network,
                    version = metadata.version.ifBlank { defaultWalletVersion },
                    publicKey = publicKey,
                    balanceNano = balance,
                    balance = formattedBalance,
                    transactions = cachedTransactions,
                    lastUpdated = System.currentTimeMillis(),
                    connectedSessions = walletSessions,
                    createdAt = createdAt,
                    interfaceType = interfaceType,
                ),
            )
        }
        return result
    }

    suspend fun persistActiveWalletPreference(address: String?) {
        if (lastPersistedActiveWallet == address) return
        val updatedPrefs = UserPreferences(activeWalletAddress = address)
        storage.saveUserPreferences(updatedPrefs)
        lastPersistedActiveWallet = address
    }

    suspend fun switchNetworkIfNeeded(target: TONNetwork, onRefresh: suspend () -> Unit) {
        if (target == currentNetwork) return
        currentNetwork = target
        walletMetadata.clear()
        pendingWallets.clear()
        onRefresh()
    }

    suspend fun clearCachesForReset() {
        tonWallets.clear()
        walletMetadata.clear()
        transactionCache.clearAll()
        lastPersistedActiveWallet = null
    }

    private suspend fun rehydrateWalletsFromStorage(): Boolean {
        val stored = storage.loadAllWallets()
        if (stored.isEmpty()) {
            Log.d(LOG_TAG, "rehydrate: storage empty, nothing to restore")
            return false
        }

        val kit = kitProvider()
        var restoredCount = 0
        for ((storedAddress, record) in stored) {
            val interfaceType = record.interfaceType
            if (interfaceType != WalletInterfaceType.MNEMONIC.value) {
                Log.w(
                    LOG_TAG,
                    "rehydrate: skipping $storedAddress (interfaceType=$interfaceType not supported for auto-restore)",
                )
                continue
            }

            val networkEnum = record.network.toTonNetwork(currentNetwork)
            val version = record.version.ifBlank { defaultWalletVersion }
            val name = record.name.ifBlank { defaultWalletNameProvider(restoredCount) }

            val result = runCatching {
                when (version) {
                    "v4r2" -> kit.createV4R2WalletFromMnemonic(
                        mnemonic = record.mnemonic,
                        network = networkEnum,
                    )
                    "v5r1" -> kit.createV5R1WalletFromMnemonic(
                        mnemonic = record.mnemonic,
                        network = networkEnum,
                    )
                    else -> {
                        Log.w(LOG_TAG, "rehydrate: unsupported version $version for $storedAddress")
                        null
                    }
                }
            }
            if (result.getOrNull() == null) {
                continue
            }
            result.onSuccess { walletNullable ->
                val wallet = walletNullable ?: return@onSuccess
                val restoredAddress = wallet.address
                if (restoredAddress.isNullOrBlank()) {
                    Log.w(LOG_TAG, "rehydrate: wallet added but address null for stored $storedAddress")
                    return@onSuccess
                }

                tonWallets[restoredAddress] = wallet
                walletMetadata[restoredAddress] = WalletMetadata(
                    name = name,
                    network = networkEnum,
                    version = version,
                )

                if (restoredAddress != storedAddress) {
                    Log.w(
                        LOG_TAG,
                        "rehydrate: restored address mismatch stored=$storedAddress restored=$restoredAddress",
                    )
                }

                restoredCount += 1
                Log.d(
                    LOG_TAG,
                    "rehydrate: restored wallet $restoredAddress (name='$name', network=$networkEnum, version=$version)",
                )
            }.onFailure {
                Log.e(LOG_TAG, "rehydrate: failed to restore $storedAddress", it)
            }
        }

        return restoredCount > 0
    }

    private suspend fun ensureMetadataForAddress(address: String): WalletMetadata {
        walletMetadata[address]?.let { return it }

        val pending = pendingWallets.removeLastOrNull()
        val storedRecord = storage.loadWallet(address)
        val metadata = pending?.metadata
            ?: storedRecord?.let {
                WalletMetadata(
                    name = it.name,
                    network = it.network.toTonNetwork(currentNetwork),
                    version = it.version,
                )
            }
            ?: WalletMetadata(
                name = defaultWalletNameProvider(walletMetadata.size),
                network = currentNetwork,
                version = defaultWalletVersion,
            )
        walletMetadata[address] = metadata

        if (pending?.mnemonic != null) {
            val record = WalletRecord(
                mnemonic = pending.mnemonic,
                name = metadata.name,
                network = metadata.network.toBridgeValue(),
                version = metadata.version,
            )
            runCatching { storage.saveWallet(address, record) }
                .onSuccess { Log.d(LOG_TAG, "ensureMetadataForAddress: saved pending record for $address") }
                .onFailure { Log.e(LOG_TAG, "ensureMetadataForAddress: failed to save pending record for $address", it) }
        } else if (storedRecord != null) {
            val needsUpdate = storedRecord.name != metadata.name ||
                storedRecord.network != metadata.network.toBridgeValue() ||
                storedRecord.version != metadata.version
            if (needsUpdate) {
                val record = WalletRecord(
                    mnemonic = storedRecord.mnemonic,
                    name = metadata.name,
                    network = metadata.network.toBridgeValue(),
                    version = metadata.version,
                    interfaceType = storedRecord.interfaceType,
                    createdAt = storedRecord.createdAt,
                )
                runCatching { storage.saveWallet(address, record) }
                    .onSuccess { Log.d(LOG_TAG, "ensureMetadataForAddress: refreshed stored record for $address") }
                    .onFailure { Log.e(LOG_TAG, "ensureMetadataForAddress: refresh save failed for $address", it) }
            }
        }

        return metadata
    }

    companion object {
        private const val LOG_TAG = "WalletLifecycleMgr"
    }
}
