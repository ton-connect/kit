package io.ton.walletkit.demo.presentation.viewmodel

import android.os.Build
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.data.cache.TransactionCache
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.UserPreferences
import io.ton.walletkit.demo.data.storage.WalletRecord
import io.ton.walletkit.demo.domain.model.PendingWalletRecord
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.domain.model.WalletMetadata
import io.ton.walletkit.demo.domain.model.toBridgeValue
import io.ton.walletkit.demo.domain.model.toTonNetwork
import io.ton.walletkit.demo.presentation.model.ConnectPermissionUi
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionDetailUi
import io.ton.walletkit.demo.presentation.model.TransactionMessageUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.state.SheetState
import io.ton.walletkit.demo.presentation.state.WalletUiState
import io.ton.walletkit.demo.presentation.util.TransactionDiffUtil
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.domain.model.Transaction
import io.ton.walletkit.domain.model.TransactionType
import io.ton.walletkit.presentation.TONWallet
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.request.TONWalletConnectionRequest
import io.ton.walletkit.presentation.request.TONWalletSignDataRequest
import io.ton.walletkit.presentation.request.TONWalletTransactionRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.Locale
import java.util.TimeZone
import kotlin.collections.ArrayDeque
import kotlin.collections.firstOrNull

class WalletKitViewModel(
    private val storage: DemoAppStorage,
    private val sdkEvents: SharedFlow<TONWalletKitEvent>,
    private val sdkInitialized: SharedFlow<Boolean>,
) : ViewModel() {

    private val _state = MutableStateFlow(
        WalletUiState(
            status = "Loading wallets…",
        ),
    )
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    private var balanceJob: Job? = null
    private var currentNetwork: TONNetwork = DEFAULT_NETWORK

    private val walletMetadata = mutableMapOf<String, WalletMetadata>()
    private val pendingWallets = ArrayDeque<PendingWalletRecord>()

    // Transaction cache for efficient list updates
    private val transactionCache = TransactionCache()

    // TONWallet instances (loaded from SDK)
    private val tonWallets = mutableMapOf<String, TONWallet>()

    init {
        // Wait for SDK initialization before bootstrapping
        viewModelScope.launch {
            sdkInitialized.first { it } // Wait for true
            bootstrap()
        }

        // Listen to SDK events
        viewModelScope.launch {
            sdkEvents.collect { event ->
                handleSdkEvent(event)
            }
        }
    }

    private suspend fun bootstrap() {
        _state.update { it.copy(status = "Loading wallets…", error = null) }

        // Load user preferences (including active wallet address)
        val userPrefs = storage.loadUserPreferences()
        val savedActiveWallet = userPrefs?.activeWalletAddress
        Log.d(LOG_TAG, "Loaded saved active wallet: $savedActiveWallet")

        // SDK already initialized in Application
        currentNetwork = DEFAULT_NETWORK

        // Load wallets from SDK (auto-restored from persistent storage)
        val loadResult = runCatching {
            val wallets = TONWallet.wallets()
            wallets.forEach { wallet ->
                wallet.address?.let { address ->
                    tonWallets[address] = wallet
                }
            }
            Log.d(LOG_TAG, "Loaded ${wallets.size} wallets from SDK")
        }

        if (loadResult.isFailure) {
            _state.update {
                it.copy(
                    status = "Failed to load wallets",
                    error = loadResult.exceptionOrNull()?.message ?: "Load error",
                )
            }
            return
        }

        // Migrate legacy wallets if needed (this will add them to SDK)
        migrateLegacyWallets()

        // Reload wallets after potential migration
        val walletsAfterMigration = TONWallet.wallets()
        tonWallets.clear()
        walletsAfterMigration.forEach { wallet ->
            wallet.address?.let { address ->
                tonWallets[address] = wallet
            }
        }
        Log.d(LOG_TAG, "After migration: ${walletsAfterMigration.size} wallets in SDK")

        _state.update { it.copy(initialized = true, status = "Ready", error = null) }

        // Load wallets first, then fetch transactions for active wallet
        refreshWallets()
        refreshSessions()

        // Add delay after wallet loading to avoid rate limiting
        delay(1000)

        // Restore saved active wallet after wallets are loaded
        if (savedActiveWallet != null) {
            _state.update { it.copy(activeWalletAddress = savedActiveWallet) }
            Log.d(LOG_TAG, "Restored active wallet selection: $savedActiveWallet")
            // Fetch transactions for the restored active wallet
            refreshTransactions(savedActiveWallet)
        } else {
            // Fetch transactions for the first wallet if no saved wallet
            state.value.activeWalletAddress?.let { address ->
                refreshTransactions(address)
            }
        }

        startBalancePolling()
    }

    /**
     * Handle SDK events from the shared flow.
     */
    private fun handleSdkEvent(event: TONWalletKitEvent) {
        Log.d(LOG_TAG, "=== handleSdkEvent: ${event::class.simpleName} ===")
        when (event) {
            is TONWalletKitEvent.ConnectRequest -> {
                Log.d(LOG_TAG, "Handling ConnectRequest")
                onConnectRequest(event.request)
            }
            is TONWalletKitEvent.TransactionRequest -> {
                Log.d(LOG_TAG, "Handling TransactionRequest")
                onTransactionRequest(event.request)
            }
            is TONWalletKitEvent.SignDataRequest -> {
                Log.d(LOG_TAG, "Handling SignDataRequest")
                onSignDataRequest(event.request)
            }
            is TONWalletKitEvent.Disconnect -> {
                Log.d(LOG_TAG, "Session disconnected: ${event.event.sessionId}")
                viewModelScope.launch { refreshSessions() }
            }
        }
    }

    /**
     * Restore wallet metadata from demo storage.
     * If SDK has no wallets, migrate them from legacy storage.
     */
    private suspend fun migrateLegacyWallets() {
        try {
            val storedWallets = storage.loadAllWallets()

            if (storedWallets.isEmpty()) {
                Log.d(LOG_TAG, "No legacy wallets to migrate")
                return
            }

            Log.d(LOG_TAG, "Loading metadata for ${storedWallets.size} wallets from demo storage")

            // Check if we need to migrate wallets to SDK
            val sdkWallets = TONWallet.wallets()
            val needsMigration = sdkWallets.isEmpty() && storedWallets.isNotEmpty()

            if (needsMigration) {
                Log.d(LOG_TAG, "Migrating ${storedWallets.size} wallets from legacy storage to SDK")
            }

            storedWallets.forEach { (address, record) ->
                try {
                    val network = record.network.toTonNetwork(currentNetwork)
                    val version = record.version ?: DEFAULT_WALLET_VERSION
                    val displayName = record.name ?: defaultWalletName(walletMetadata.size)

                    // Store metadata for UI
                    walletMetadata[address] = WalletMetadata(
                        name = displayName,
                        network = network,
                        version = version,
                    )

                    // Migrate wallet to SDK if needed
                    if (needsMigration && record.mnemonic != null) {
                        Log.d(LOG_TAG, "Migrating wallet to SDK: $address ($displayName)")
                        try {
                            val wallet = TONWallet.add(
                                TONWalletData(
                                    mnemonic = record.mnemonic,
                                    name = displayName,
                                    version = version,
                                    network = network,
                                ),
                            )
                            wallet.address?.let { tonWallets[it] = wallet }
                            Log.d(LOG_TAG, "Successfully migrated wallet: $address")
                        } catch (e: Exception) {
                            Log.e(LOG_TAG, "Failed to migrate wallet to SDK: $address", e)
                        }
                    }

                    Log.d(LOG_TAG, "Loaded metadata for wallet: $address ($displayName)")
                } catch (e: Exception) {
                    Log.e(LOG_TAG, "Failed to load metadata for wallet: $address", e)
                }
            }

            Log.d(LOG_TAG, "Metadata loaded for ${walletMetadata.size} wallets")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Migration failed", e)
        }
    }

    private fun startBalancePolling() {
        balanceJob?.cancel()
        balanceJob = viewModelScope.launch {
            while (true) {
                delay(BALANCE_REFRESH_MS)
                refreshWallets()
            }
        }
    }

    fun refreshAll() {
        viewModelScope.launch {
            refreshWallets()
            refreshSessions()
        }
    }

    suspend fun refreshWallets() {
        _state.update { it.copy(isLoadingWallets = true) }
        val summaries = runCatching { loadWalletSummaries() }
        summaries.onSuccess { wallets ->
            val now = System.currentTimeMillis()

            // Set active wallet based on saved preference or default to first
            val activeAddress = state.value.activeWalletAddress
            val newActiveAddress = when {
                wallets.isEmpty() -> null
                // Keep current active wallet if it still exists
                activeAddress != null && wallets.any { it.address == activeAddress } -> activeAddress
                // Otherwise use first wallet
                else -> wallets.firstOrNull()?.address
            }

            _state.update {
                it.copy(
                    wallets = wallets,
                    activeWalletAddress = newActiveAddress,
                    lastUpdated = now,
                    error = null,
                )
            }
        }.onFailure { error ->
            _state.update { it.copy(error = error.message ?: "Failed to load wallets") }
        }
        _state.update { it.copy(isLoadingWallets = false) }
    }

    fun refreshSessions() {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingSessions = true) }

            // Aggregate sessions from all wallets
            val allSessions = mutableListOf<io.ton.walletkit.domain.model.WalletSession>()
            tonWallets.values.forEach { wallet ->
                runCatching {
                    val walletSessions = wallet.sessions()
                    allSessions.addAll(walletSessions)
                }.onFailure {
                    Log.w(LOG_TAG, "Failed to get sessions for wallet ${wallet.address}", it)
                }
            }

            Log.d(LOG_TAG, "Loaded ${allSessions.size} sessions from ${tonWallets.size} wallets")
            allSessions.forEach { session ->
                Log.d(
                    LOG_TAG,
                    "Session: id=${session.sessionId}, dApp=${session.dAppName}, " +
                        "wallet=${session.walletAddress}, url=${session.dAppUrl}",
                )
            }

            val mapped = allSessions.mapNotNull { session ->
                val sessionUrl = sanitizeUrl(session.dAppUrl)
                val sessionManifest = sanitizeUrl(session.manifestUrl)
                val sessionIcon = sanitizeUrl(session.iconUrl)

                // Skip sessions with no metadata (appears disconnected)
                val appearsDisconnected = sessionUrl == null && sessionManifest == null
                if (appearsDisconnected && session.sessionId.isNotBlank()) {
                    Log.d(
                        LOG_TAG,
                        "Empty metadata for session ${session.sessionId}",
                    )
                    return@mapNotNull null
                }

                SessionSummary(
                    sessionId = session.sessionId,
                    dAppName = session.dAppName.ifBlank { "Unknown dApp" },
                    walletAddress = session.walletAddress,
                    dAppUrl = sessionUrl,
                    manifestUrl = sessionManifest,
                    iconUrl = sessionIcon,
                    createdAt = parseTimestamp(session.createdAtIso),
                    lastActivity = parseTimestamp(session.lastActivityIso),
                )
            }
            val finalSessions = mapped
            finalSessions.forEach { summary ->
                Log.d(
                    LOG_TAG,
                    "Mapped session summary: id=${summary.sessionId}, dApp=${summary.dAppName}, " +
                        "url=${summary.dAppUrl}, icon=${summary.iconUrl}",
                )
            }
            _state.update { it.copy(sessions = finalSessions, error = null, isLoadingSessions = false) }
        }
    }

    fun openAddWalletSheet() {
        setSheet(SheetState.AddWallet)
    }

    fun showWalletDetails(address: String) {
        val target = state.value.wallets.firstOrNull { it.address == address }
        if (target != null) {
            setSheet(SheetState.WalletDetails(target))
        }
    }

    fun dismissSheet() {
        setSheet(SheetState.None)
    }

    fun showUrlPrompt() {
        _state.update { it.copy(isUrlPromptVisible = true) }
    }

    fun hideUrlPrompt() {
        _state.update { it.copy(isUrlPromptVisible = false) }
    }

    fun importWallet(
        name: String,
        network: TONNetwork,
        words: List<String>,
        version: String = DEFAULT_WALLET_VERSION,
        interfaceType: WalletInterfaceType = WalletInterfaceType.MNEMONIC,
    ) {
        val cleaned = words.map { it.trim().lowercase() }.filter { it.isNotBlank() }
        if (cleaned.size != 24) {
            _state.update { it.copy(error = "Recovery phrase must contain 24 words") }
            return
        }

        val pending = PendingWalletRecord(
            metadata = WalletMetadata(name.ifBlank { defaultWalletName(state.value.wallets.size) }, network, version),
            mnemonic = cleaned,
        )

        viewModelScope.launch {
            switchNetworkIfNeeded(network)
            pendingWallets.addLast(pending)

            val walletData = TONWalletData(
                mnemonic = cleaned,
                name = pending.metadata.name,
                version = version,
                network = network,
            )

            val result = runCatching {
                TONWallet.add(walletData)
            }

            if (result.isSuccess) {
                val newWallet = result.getOrNull()

                // Cache the wallet
                newWallet?.address?.let { address ->
                    tonWallets[address] = newWallet

                    // Store metadata and mnemonic for UI
                    walletMetadata[address] = pending.metadata
                    val record = WalletRecord(
                        mnemonic = cleaned,
                        name = pending.metadata.name,
                        network = network.toBridgeValue(),
                        version = version,
                        interfaceType = interfaceType.value,
                    )
                    runCatching { storage.saveWallet(address, record) }
                }

                refreshWallets()
                dismissSheet()

                // Automatically switch to the newly imported wallet
                newWallet?.address?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    saveActiveWalletPreference(address)
                    Log.d(LOG_TAG, "Auto-switched to newly imported wallet: $address")
                }

                logEvent("Imported wallet '${pending.metadata.name}' (version: $version, type: ${interfaceType.value})")
            } else {
                pendingWallets.removeLastOrNull()
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: "Failed to import wallet") }
            }
        }
    }

    fun generateWallet(
        name: String,
        network: TONNetwork,
        version: String = DEFAULT_WALLET_VERSION,
        interfaceType: WalletInterfaceType = WalletInterfaceType.MNEMONIC,
    ) {
        val words = generateMnemonic()
        val pending = PendingWalletRecord(
            metadata = WalletMetadata(name.ifBlank { defaultWalletName(state.value.wallets.size) }, network, version),
            mnemonic = words,
        )
        viewModelScope.launch {
            switchNetworkIfNeeded(network)
            pendingWallets.addLast(pending)

            val walletData = TONWalletData(
                mnemonic = words,
                name = pending.metadata.name,
                version = version,
                network = network,
            )

            val result = runCatching {
                TONWallet.add(walletData)
            }

            if (result.isSuccess) {
                val newWallet = result.getOrNull()

                // Cache the wallet
                newWallet?.address?.let { address ->
                    tonWallets[address] = newWallet

                    // Store metadata and mnemonic for UI
                    walletMetadata[address] = pending.metadata
                    val record = WalletRecord(
                        mnemonic = words,
                        name = pending.metadata.name,
                        network = network.toBridgeValue(),
                        version = version,
                        interfaceType = interfaceType.value,
                    )
                    runCatching { storage.saveWallet(address, record) }
                }

                refreshWallets()
                dismissSheet()

                // Automatically switch to the newly generated wallet
                newWallet?.address?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    saveActiveWalletPreference(address)
                    Log.d(LOG_TAG, "Auto-switched to newly generated wallet: $address")
                }

                logEvent("Generated wallet '${pending.metadata.name}' (version: $version, type: ${interfaceType.value})")
            } else {
                pendingWallets.removeLastOrNull()
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: "Failed to generate wallet") }
            }
        }
    }

    fun handleTonConnectUrl(url: String) {
        viewModelScope.launch {
            val trimmed = url.trim()

            // Get active wallet to connect
            val activeAddress = state.value.activeWalletAddress
            val wallet = activeAddress?.let { tonWallets[it] }

            if (wallet == null) {
                _state.update { it.copy(error = "No wallet selected") }
                return@launch
            }

            val result = runCatching { wallet.connect(trimmed) }
            result.onSuccess {
                hideUrlPrompt()
                logEvent("Handled TON Connect URL")
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Ton Connect error") }
            }
        }
    }

    fun approveConnect(request: ConnectRequestUi, wallet: WalletSummary) {
        viewModelScope.launch {
            val result = runCatching {
                request.connectRequest?.approve(wallet.address)
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                refreshSessions()
                logEvent("Approved connect for ${request.dAppName}")
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to approve connect request") }
            }
        }
    }

    fun rejectConnect(request: ConnectRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            val result = runCatching {
                request.connectRequest?.reject(reason)
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                logEvent("Rejected connect for ${request.dAppName}")
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to reject connect request") }
            }
        }
    }

    fun approveTransaction(request: TransactionRequestUi) {
        viewModelScope.launch {
            val result = runCatching {
                request.transactionRequest?.approve()
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                refreshWallets() // Refresh to show updated balance after transaction is sent
                refreshSessions()
                logEvent("Approved and sent transaction ${request.id}")
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to approve transaction") }
            }
        }
    }

    fun rejectTransaction(request: TransactionRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            val result = runCatching {
                request.transactionRequest?.reject(reason)
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                logEvent("Rejected transaction ${request.id}")
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to reject transaction") }
            }
        }
    }

    fun approveSignData(request: SignDataRequestUi) {
        viewModelScope.launch {
            Log.d(LOG_TAG, "Approving sign data request ID: ${request.id}")

            // Check if this wallet uses Signer interface type
            val wallet = state.value.wallets.firstOrNull { it.address == request.walletAddress }
            if (wallet?.interfaceType == WalletInterfaceType.SIGNER) {
                // For Signer wallets, show confirmation dialog first
                Log.d(LOG_TAG, "Wallet is SIGNER type, requesting confirmation")
                _state.update { it.copy(pendingSignerConfirmation = request) }
                return@launch
            }

            // For MNEMONIC wallets, approve immediately
            val result = runCatching {
                request.signDataRequest?.approve()
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()

                // Log approval
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "✅ SIGN DATA APPROVED")
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "Request ID: ${request.id}")
                Log.d(LOG_TAG, "Payload Type: ${request.payloadType}")
                Log.d(LOG_TAG, "========================================")

                logEvent("✅ Sign data approved")

                _state.update {
                    it.copy(
                        status = "✅ Signed successfully",
                        error = null,
                    )
                }

                // Auto-hide success message after 10 seconds
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        // Only clear if the status is still the success message
                        if (currentState.status == "✅ Signed successfully") {
                            currentState.copy(status = "WalletKit ready")
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                Log.e(LOG_TAG, "❌ Sign data approval failed", error)
                logEvent("❌ Sign data approval failed: ${error.message}")
                _state.update { it.copy(error = error.message ?: "Failed to approve sign request") }
            }
        }
    }

    fun rejectSignData(request: SignDataRequestUi, reason: String = "User rejected") {
        viewModelScope.launch {
            val result = runCatching {
                request.signDataRequest?.reject(reason)
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                Log.d(LOG_TAG, "❌ Rejected sign request ${request.id}: $reason")
                logEvent("❌ Rejected sign request")
                _state.update { it.copy(status = "Sign data request rejected") }

                // Auto-hide rejection message after 10 seconds
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        if (currentState.status == "Sign data request rejected") {
                            currentState.copy(status = "WalletKit ready")
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to reject sign request") }
            }
        }
    }

    fun confirmSignerApproval() {
        viewModelScope.launch {
            val request = state.value.pendingSignerConfirmation
            if (request == null) {
                Log.w(LOG_TAG, "No pending signer confirmation to approve")
                return@launch
            }

            Log.d(LOG_TAG, "User confirmed signer approval for request ID: ${request.id}")
            
            // Clear the confirmation dialog
            _state.update { it.copy(pendingSignerConfirmation = null) }

            // Now actually approve the request
            val result = runCatching {
                request.signDataRequest?.approve()
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()

                // Log approval
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "✅ SIGN DATA APPROVED (via SIGNER confirmation)")
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "Request ID: ${request.id}")
                Log.d(LOG_TAG, "Payload Type: ${request.payloadType}")
                Log.d(LOG_TAG, "========================================")

                logEvent("✅ Sign data approved (via Signer confirmation)")

                // Update transaction details after signing
                launch {
                    delay(200)
                    request.walletAddress?.let { address ->
                        if (state.value.activeWalletAddress == address) {
                            refreshTransactions(address)
                        }
                    }
                }
            }.onFailure { error ->
                Log.e(LOG_TAG, "❌ Sign data approval failed", error)
                logEvent("❌ Sign data approval failed: ${error.message}")
                _state.update { it.copy(error = error.message ?: "Failed to approve sign request") }
            }
        }
    }

    fun cancelSignerApproval() {
        viewModelScope.launch {
            val request = state.value.pendingSignerConfirmation
            if (request == null) {
                Log.w(LOG_TAG, "No pending signer confirmation to cancel")
                return@launch
            }

            Log.d(LOG_TAG, "User cancelled signer approval for request ID: ${request.id}")

            // Clear the confirmation dialog
            _state.update { it.copy(pendingSignerConfirmation = null) }

            // Reject the request
            val result = runCatching {
                request.signDataRequest?.reject("User cancelled signer confirmation")
                    ?: error("Request object not available")
            }

            result.onSuccess {
                dismissSheet()
                Log.d(LOG_TAG, "❌ Rejected sign request ${request.id}: User cancelled signer confirmation")
                logEvent("❌ Sign request cancelled")
                _state.update { it.copy(status = "Sign data request cancelled") }

                // Auto-hide cancellation message
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        if (currentState.status == "Sign data request cancelled") {
                            currentState.copy(status = "WalletKit ready")
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to cancel sign request") }
            }
        }
    }

    fun disconnectSession(sessionId: String) {
        viewModelScope.launch {
            // Note: Session disconnection is handled via wallet instances
            // SDK will handle cleanup internally
            refreshSessions()
            logEvent("Disconnected session $sessionId")
        }
    }

    fun openSendTransactionSheet(walletAddress: String) {
        val wallet = state.value.wallets.firstOrNull { it.address == walletAddress }
        if (wallet != null) {
            setSheet(SheetState.SendTransaction(wallet))
        }
    }

    fun sendTransaction(walletAddress: String, recipient: String, amount: String, comment: String = "") {
        viewModelScope.launch {
            _state.update { it.copy(isSendingTransaction = true, error = null) }
            val result = runCatching {
                // TODO: Implement transaction sending using public API
                // This would typically involve creating a transaction request
                // that gets approved by the user
                throw UnsupportedOperationException("Direct transaction sending not yet implemented in public API")
            }

            result.onSuccess {
                _state.update { it.copy(isSendingTransaction = false) }
            }.onFailure { error ->
                _state.update {
                    it.copy(
                        isSendingTransaction = false,
                        error = error.message ?: "Failed to create transaction",
                    )
                }
            }
        }
    }

    fun toggleWalletSwitcher() {
        _state.update { it.copy(isWalletSwitcherExpanded = !it.isWalletSwitcherExpanded) }
    }

    fun switchWallet(address: String) {
        viewModelScope.launch {
            val wallet = state.value.wallets.firstOrNull { it.address == address }
            if (wallet == null) {
                _state.update { it.copy(error = "Wallet not found") }
                return@launch
            }

            _state.update {
                it.copy(
                    activeWalletAddress = address,
                    isWalletSwitcherExpanded = false,
                    error = null,
                )
            }

            // Save active wallet preference
            saveActiveWalletPreference(address)

            // Refresh wallet state to get latest balance, then transactions
            refreshWallets()
            logEvent("Switched to wallet: ${wallet.name}")
            
            // Add delay before fetching transactions to avoid rate limiting
            delay(1000)
            refreshTransactions(address)
        }
    }

    /**
     * Save the active wallet address to persistent storage.
     */
    private fun saveActiveWalletPreference(address: String) {
        viewModelScope.launch {
            try {
                val updatedPrefs = UserPreferences(
                    activeWalletAddress = address,
                )
                storage.saveUserPreferences(updatedPrefs)
                Log.d(LOG_TAG, "Saved active wallet preference: $address")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to save active wallet preference", e)
            }
        }
    }

    fun refreshTransactions(address: String? = state.value.activeWalletAddress, limit: Int = TRANSACTION_FETCH_LIMIT) {
        val targetAddress = address ?: return
        viewModelScope.launch {
            val refreshErrorMessage = "Failed to refresh transactions"
            _state.update { it.copy(isLoadingTransactions = true) }

            // Try to get cached transactions first for immediate display
            val cachedTransactions = transactionCache.get(targetAddress)
            if (cachedTransactions != null) {
                Log.d(LOG_TAG, "Using cached transactions for $targetAddress: ${cachedTransactions.size} items")
                _state.update { current ->
                    val updatedWallets = current.wallets.map { summary ->
                        if (summary.address == targetAddress) {
                            summary.copy(transactions = cachedTransactions)
                        } else {
                            summary
                        }
                    }
                    current.copy(wallets = updatedWallets)
                }
            }

            // Fetch fresh transactions from network via wallet instance
            val wallet = tonWallets[targetAddress]
            val result = if (wallet != null) {
                runCatching { wallet.transactions() }
            } else {
                Result.failure(Exception("Wallet not found"))
            }

            result.onSuccess { newTransactions ->
                // Update cache with new transactions (merges with existing)
                val mergedTransactions = transactionCache.update(targetAddress, newTransactions)

                // Calculate diff for logging/debugging
                val oldList = cachedTransactions ?: emptyList()
                if (oldList.isNotEmpty()) {
                    val newItems = TransactionDiffUtil.getNewTransactions(oldList, mergedTransactions)
                    if (newItems.isNotEmpty()) {
                        Log.d(LOG_TAG, "Found ${newItems.size} new transactions for $targetAddress")
                    }
                }

                _state.update { current ->
                    val updatedWallets = current.wallets.map { summary ->
                        if (summary.address == targetAddress) {
                            summary.copy(transactions = mergedTransactions)
                        } else {
                            summary
                        }
                    }
                    val updatedError = if (current.error == refreshErrorMessage) null else current.error
                    current.copy(
                        wallets = updatedWallets,
                        isLoadingTransactions = false,
                        error = updatedError,
                    )
                }
            }.onFailure { error ->
                Log.e(LOG_TAG, "Failed to refresh transactions for $targetAddress", error)
                _state.update {
                    it.copy(
                        isLoadingTransactions = false,
                        error = error.message ?: refreshErrorMessage,
                    )
                }
            }
        }
    }

    fun showTransactionDetail(transactionHash: String, walletAddress: String) {
        val wallet = state.value.wallets.firstOrNull { it.address == walletAddress } ?: return
        val transactions = wallet.transactions ?: return

        // Find the transaction by hash
        val tx = transactions.firstOrNull { it.hash == transactionHash } ?: return

        // Parse transaction details
        val detail = parseTransactionDetail(tx, walletAddress)
        _state.update { it.copy(sheetState = SheetState.TransactionDetail(detail)) }
    }

    private fun parseTransactionDetail(tx: Transaction, walletAddress: String): TransactionDetailUi {
        val isOutgoing = tx.type == TransactionType.OUTGOING

        // Transaction already has parsed data from the bridge
        return TransactionDetailUi(
            hash = tx.hash,
            timestamp = tx.timestamp,
            amount = formatNanoTon(tx.amount),
            fee = tx.fee?.let { formatNanoTon(it) } ?: "0 TON",
            fromAddress = tx.sender ?: (if (isOutgoing) walletAddress else "Unknown"),
            toAddress = tx.recipient ?: (if (!isOutgoing) walletAddress else "Unknown"),
            comment = tx.comment,
            status = "Success", // Transactions from bridge are already filtered/successful
            lt = tx.lt ?: "0",
            blockSeqno = tx.blockSeqno ?: 0,
            isOutgoing = isOutgoing,
        )
    }

    private fun formatNanoTon(nanoTon: String): String = try {
        val value = nanoTon.toLongOrNull() ?: 0L
        val ton = value.toDouble() / 1_000_000_000.0
        String.format(Locale.US, "%.4f", ton)
    } catch (e: Exception) {
        "0.0000"
    }

    fun removeWallet(address: String) {
        viewModelScope.launch {
            val wallet = tonWallets[address]
            if (wallet == null) {
                _state.update { it.copy(error = "Wallet not found") }
                return@launch
            }

            val removeResult = runCatching { wallet.remove() }
            if (removeResult.isFailure) {
                val reason = removeResult.exceptionOrNull()?.message ?: "Failed to remove wallet"
                _state.update { it.copy(error = reason) }
                return@launch
            }

            // Remove from cache
            tonWallets.remove(address)

            runCatching { storage.clear(address) }.onFailure {
                Log.w(LOG_TAG, "removeWallet: failed to clear storage for $address", it)
            }

            // Clear transaction cache for removed wallet
            transactionCache.clear(address)

            walletMetadata.remove(address)

            val walletName = state.value.wallets.firstOrNull { it.address == address }?.name ?: "wallet"

            _state.update {
                val filteredWallets = it.wallets.filterNot { summary -> summary.address == address }
                val newActiveAddress = when {
                    filteredWallets.isEmpty() -> null
                    it.activeWalletAddress == address -> filteredWallets.first().address
                    else -> it.activeWalletAddress
                }
                it.copy(
                    wallets = filteredWallets,
                    activeWalletAddress = newActiveAddress,
                    isWalletSwitcherExpanded = if (filteredWallets.size <= 1) false else it.isWalletSwitcherExpanded,
                )
            }

            refreshWallets()
            refreshSessions() // Refresh to update UI with removed sessions

            logEvent("Removed wallet: $walletName")
        }
    }

    fun renameWallet(address: String, newName: String) {
        val metadata = walletMetadata[address]
        if (metadata == null) {
            _state.update { it.copy(error = "Wallet not found") }
            return
        }

        val updated = metadata.copy(name = newName.ifBlank { defaultWalletName(0) })
        walletMetadata[address] = updated

        // Update storage
        viewModelScope.launch {
            val storedWallet = storage.loadWallet(address)
            if (storedWallet != null) {
                val updatedRecord = WalletRecord(
                    mnemonic = storedWallet.mnemonic,
                    name = updated.name,
                    network = updated.network.toBridgeValue(),
                    version = updated.version,
                )
                storage.saveWallet(address, updatedRecord)
            }

            // Refresh to update UI
            refreshWallets()
            logEvent("Renamed wallet to: $newName")
        }
    }

    private suspend fun loadWalletSummaries(): List<WalletSummary> {
        // Get wallets from SDK and update cache
        val wallets = TONWallet.wallets()
        wallets.forEach { wallet ->
            wallet.address?.let { address ->
                tonWallets[address] = wallet
            }
        }

        Log.d(LOG_TAG, "loadWalletSummaries: got ${wallets.size} wallets from SDK")
        val knownAddresses = wallets.mapNotNull { it.address }.toSet()
        walletMetadata.keys.retainAll(knownAddresses)

        val result = mutableListOf<WalletSummary>()
        for (wallet in wallets) {
            val address = wallet.address ?: continue
            val publicKey = wallet.publicKey
            val metadata = ensureMetadataForAddress(address, publicKey)

            Log.d(LOG_TAG, "loadWalletSummaries: fetching state for $address")
            val stateData = runCatching {
                wallet.stateInit()
            }.onFailure {
                Log.e(LOG_TAG, "loadWalletSummaries: stateInit failed for $address", it)
            }.getOrNull()

            val balance = runCatching {
                wallet.balance()
            }.onFailure {
                Log.e(LOG_TAG, "loadWalletSummaries: balance failed for $address", it)
            }.getOrNull()

            Log.d(LOG_TAG, "loadWalletSummaries: balance for $address = $balance")
            val formatted = balance?.let(::formatTon)

            // Use cached transactions only - don't fetch on every balance refresh
            // Transactions will be fetched explicitly via refreshTransactions()
            val cachedTransactions = transactionCache.get(address)

            // Get sessions connected to this wallet
            val walletSessions = _state.value.sessions.filter { session ->
                session.walletAddress == address
            }

            // Get creation date from stored record
            val storedRecord = storage.loadWallet(address)
            val createdAt = storedRecord?.createdAt
            val interfaceType = storedRecord?.interfaceType?.let { WalletInterfaceType.fromValue(it) }
                ?: WalletInterfaceType.MNEMONIC

            val summary = WalletSummary(
                address = address,
                name = metadata.name,
                network = metadata.network,
                version = metadata.version.ifBlank { DEFAULT_WALLET_VERSION },
                publicKey = publicKey,
                balanceNano = balance,
                balance = formatted,
                transactions = cachedTransactions,
                lastUpdated = System.currentTimeMillis(),
                connectedSessions = walletSessions,
                createdAt = createdAt,
                interfaceType = interfaceType,
            )
            result.add(summary)
            
            // Add small delay between wallets to avoid rate limiting (429 errors)
            // Only delay if there are more wallets to process
            if (wallet != wallets.last()) {
                delay(300) // 300ms delay between wallet API calls
            }
        }
        return result
    }

    private suspend fun ensureMetadataForAddress(address: String, publicKey: String?): WalletMetadata {
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
                name = defaultWalletName(walletMetadata.size),
                network = currentNetwork,
                version = DEFAULT_WALLET_VERSION,
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
                )
                runCatching { storage.saveWallet(address, record) }
            }
        }

        return metadata
    }

    private suspend fun ensureWallet() {
        val existing = TONWallet.wallets()
        if (existing.isNotEmpty()) {
            // Update cache
            existing.forEach { wallet ->
                wallet.address?.let { address ->
                    tonWallets[address] = wallet
                    ensureMetadataForAddress(address, "")
                }
            }
            return
        }

        val metadata = WalletMetadata(
            name = DEMO_WALLET_NAME,
            network = currentNetwork,
            version = DEFAULT_WALLET_VERSION,
        )
        val pendingRecord = PendingWalletRecord(metadata = metadata, mnemonic = DEMO_MNEMONIC)
        pendingWallets.addLast(pendingRecord)

        val walletData = TONWalletData(
            mnemonic = DEMO_MNEMONIC,
            name = DEMO_WALLET_NAME,
            version = DEFAULT_WALLET_VERSION,
            network = currentNetwork,
        )

        runCatching {
            val wallet = TONWallet.add(walletData)
            wallet.address?.let { address ->
                tonWallets[address] = wallet
            }
        }.onFailure { error ->
            pendingWallets.remove(pendingRecord)
            _state.update { it.copy(error = error.message ?: "Failed to prepare demo wallet") }
        }
    }

    private suspend fun reinitializeForNetwork(
        target: TONNetwork,
    ) {
        // Note: SDK is initialized globally, network switching not supported in current public API
        // For now, just update local state
        currentNetwork = target
        walletMetadata.clear()
        pendingWallets.clear()

        // Ensure we have at least one wallet for demo purposes
        ensureWallet()
    }

    private suspend fun switchNetworkIfNeeded(target: TONNetwork) {
        if (target == currentNetwork) return
        reinitializeForNetwork(target)
        refreshAll()
    }

    private fun setSheet(sheet: SheetState) {
        _state.update { it.copy(sheetState = sheet) }
    }

    /**
     * Event handler using sealed class pattern.
     * This provides type-safe, exhaustive when() expressions.
     */
    private fun onConnectRequest(request: TONWalletConnectionRequest) {
        // Convert to UI model for existing sheets
        val dAppInfo = request.dAppInfo
        val uiRequest = ConnectRequestUi(
            id = request.hashCode().toString(), // Use object hashCode as ID
            dAppName = dAppInfo?.name ?: "Unknown dApp",
            dAppUrl = dAppInfo?.url ?: "",
            manifestUrl = dAppInfo?.manifestUrl ?: "",
            iconUrl = dAppInfo?.iconUrl,
            permissions = request.permissions.map { perm ->
                ConnectPermissionUi(
                    name = perm.name ?: "unknown",
                    title = perm.title ?: "Permission",
                    description = perm.description ?: "",
                )
            },
            requestedItems = request.permissions.mapNotNull { it.name },
            raw = org.json.JSONObject(), // Not needed with this API
            connectRequest = request, // Store for direct approve/reject
        )

        setSheet(SheetState.Connect(uiRequest))
        logEvent("Connect request from ${dAppInfo?.name ?: "Unknown dApp"}")
    }

    private fun onTransactionRequest(request: TONWalletTransactionRequest) {
        Log.d(LOG_TAG, "=== onTransactionRequest called ===")
        // Extract wallet address from active wallet
        val walletAddress = state.value.activeWalletAddress ?: ""
        val dAppInfo = request.dAppInfo

        Log.d(LOG_TAG, "Transaction request - walletAddress: $walletAddress, dAppName: ${dAppInfo?.name}")

        // Map actual transaction messages from request
        val messages = request.messages.map { msg ->
            // Try to decode comment from payload if it's a simple text comment
            val comment = try {
                msg.payload?.let { payload ->
                    // Simple text comments are base64 encoded with opcode 0
                    // For now, we'll just show null - full decoding can be added later
                    null
                }
            } catch (_: Exception) {
                null
            }

            TransactionMessageUi(
                to = msg.address,
                amount = msg.amount,
                comment = comment,
                payload = msg.payload,
                stateInit = msg.stateInit,
            )
        }

        val uiRequest = TransactionRequestUi(
            id = request.hashCode().toString(),
            walletAddress = walletAddress,
            dAppName = dAppInfo?.name ?: "dApp",
            validUntil = request.validUntil,
            messages = messages,
            preview = null,
            raw = org.json.JSONObject(),
            transactionRequest = request,
        )

        Log.d(LOG_TAG, "Setting sheet to Transaction state with ${messages.size} messages")
        setSheet(SheetState.Transaction(uiRequest))
        Log.d(LOG_TAG, "Sheet state updated: ${state.value.sheetState}")
        logEvent("Transaction request from ${dAppInfo?.name ?: "dApp"}")
    }

    private fun onSignDataRequest(request: TONWalletSignDataRequest) {
        val dAppInfo = request.dAppInfo

        // Convert to UI model with actual payload data from request
        val uiRequest = SignDataRequestUi(
            id = request.hashCode().toString(),
            walletAddress = request.walletAddress ?: state.value.activeWalletAddress ?: "",
            dAppName = dAppInfo?.name,
            payloadType = request.payloadType.name.lowercase().replaceFirstChar { it.uppercase() },
            payloadContent = request.payloadContent,
            preview = request.preview ?: request.payloadContent,
            raw = org.json.JSONObject(),
            signDataRequest = request,
        )

        setSheet(SheetState.SignData(uiRequest))
        logEvent("Sign data request from ${dAppInfo?.name ?: "dApp"}")
    }

    // Old bridge event handler - no longer used with public API
    // Event handling now happens via handleSdkEvent() which processes TONWalletKitEvent

    private fun logEvent(message: String) {
        _state.update {
            val events = listOf(message) + it.events
            it.copy(events = events.take(MAX_EVENT_LOG))
        }
    }

    override fun onCleared() {
        balanceJob?.cancel()
        // SDK cleanup is handled globally, no per-ViewModel cleanup needed
        super.onCleared()
    }

    private fun defaultWalletName(index: Int): String = "Wallet ${index + 1}"

    private fun parseTimestamp(value: String?): Long? {
        if (value.isNullOrBlank()) return null
        return runCatching {
            when {
                value.matches(NUMERIC_PATTERN) -> value.toLong()
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> Instant.parse(value).toEpochMilli()
                else -> parseIso8601Timestamp(value)
            }
        }.getOrNull()
    }

    private fun parseIso8601Timestamp(value: String): Long {
        val candidates = buildList {
            add(value)
            normalizeIso8601Fraction(value)?.let { add(it) }
        }

        candidates.forEach { candidate ->
            ISO8601_PATTERNS.forEach { pattern ->
                val parsed = runCatching {
                    SimpleDateFormat(pattern, Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }.parse(candidate)?.time
                }.getOrNull()

                if (parsed != null) {
                    return parsed
                }
            }
        }

        throw IllegalArgumentException("Unsupported timestamp format: $value")
    }

    private fun normalizeIso8601Fraction(value: String): String? {
        val timeSeparator = value.indexOf('T')
        if (timeSeparator == -1) return null

        val fractionStart = value.indexOf('.', startIndex = timeSeparator)
        if (fractionStart == -1) return null

        val zoneStart = value.indexOfAny(charArrayOf('Z', '+', '-'), startIndex = fractionStart)
        if (zoneStart == -1) return null

        val fraction = value.substring(fractionStart + 1, zoneStart)
        if (fraction.isEmpty()) return null

        val normalized = when {
            fraction.length == 3 -> return null
            fraction.length < 3 -> fraction.padEnd(3, '0')
            else -> fraction.substring(0, 3)
        }

        val prefix = value.substring(0, fractionStart)
        val suffix = value.substring(zoneStart)
        return "$prefix.$normalized$suffix"
    }

    private fun formatTon(raw: String): String = runCatching {
        BigDecimal(raw)
            .movePointLeft(9)
            .setScale(4, RoundingMode.DOWN)
            .stripTrailingZeros()
            .toPlainString()
    }.getOrElse { raw }

    private data class NetworkEndpoints(
        val tonClientEndpoint: String,
        val tonApiUrl: String,
        val bridgeUrl: String,
        val bridgeName: String,
    )

    private fun generateMnemonic(): List<String> = List(24) { DEMO_WORDS.random() }

    private fun sanitizeUrl(value: String?): String? {
        if (value.isNullOrBlank()) return null
        if (value.equals("null", ignoreCase = true)) return null
        return value
    }

    companion object {
        private val NUMERIC_PATTERN = Regex("^-?\\d+")
        private val ISO8601_PATTERNS = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
        )
        private const val BALANCE_REFRESH_MS = 20_000L
        private const val MAX_EVENT_LOG = 12
        private const val DEFAULT_WALLET_VERSION = "v4r2"
        private const val TRANSACTION_FETCH_LIMIT = 20
        private val DEFAULT_NETWORK = TONNetwork.MAINNET
        private const val LOG_TAG = "WalletKitVM"
        private const val DEFAULT_BRIDGE_URL = "https://bridge.tonapi.io/bridge"
        private const val DEFAULT_BRIDGE_NAME = "tonkeeper"

        private val DEMO_WORDS = listOf(
            "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
            "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
            "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
            "adapt", "addict", "address", "adjust", "admit", "adult", "advance", "advice",
        )

        private val DEMO_MNEMONIC = listOf(
            "canvas", "puzzle", "ski", "divide", "crime", "arrow",
            "object", "canvas", "point", "cover", "method", "bargain",
            "siren", "bean", "shrimp", "found", "gravity", "vivid",
            "pelican", "replace", "tuition", "screen", "orange", "album",
        )

        private const val DEMO_WALLET_NAME = "Demo Wallet"

        fun factory(
            storage: DemoAppStorage,
            sdkEvents: SharedFlow<TONWalletKitEvent>,
            sdkInitialized: SharedFlow<Boolean>,
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                require(modelClass.isAssignableFrom(WalletKitViewModel::class.java))
                return WalletKitViewModel(storage, sdkEvents, sdkInitialized) as T
            }
        }
    }
}
