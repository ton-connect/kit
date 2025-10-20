package io.ton.walletkit.demo.presentation.viewmodel

import android.app.Application
import android.os.Build
import android.util.Log
import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.R
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
import io.ton.walletkit.presentation.extensions.disconnect
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
    private val application: Application,
    private val storage: DemoAppStorage,
    private val sdkEvents: SharedFlow<TONWalletKitEvent>,
    private val sdkInitialized: SharedFlow<Boolean>,
) : ViewModel() {

    private val _state = MutableStateFlow(
        WalletUiState(
            status = application.getString(R.string.wallet_status_loading),
        ),
    )
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    // Password and authentication state
    private val _isPasswordSet = MutableStateFlow(false)
    val isPasswordSet: StateFlow<Boolean> = _isPasswordSet.asStateFlow()

    private val _isUnlocked = MutableStateFlow(false)
    val isUnlocked: StateFlow<Boolean> = _isUnlocked.asStateFlow()

    private var balanceJob: Job? = null
    private var currentNetwork: TONNetwork = DEFAULT_NETWORK

    private val walletMetadata = mutableMapOf<String, WalletMetadata>()
    private val pendingWallets = ArrayDeque<PendingWalletRecord>()

    // Transaction cache for efficient list updates
    private val transactionCache = TransactionCache()

    // TONWallet instances (loaded from SDK)
    private val tonWallets = mutableMapOf<String, TONWallet>()

    private fun uiString(@StringRes resId: Int, vararg args: Any): String = application.getString(resId, *args)

    private fun logEvent(@StringRes messageRes: Int, vararg args: Any) {
        logEvent(uiString(messageRes, *args))
    }

    private val demoWalletName: String
        get() = uiString(R.string.wallet_demo_default_name)

    init {
        // Check password state on initialization (FIRST)
        _isPasswordSet.value = storage.isPasswordSet()
        _isUnlocked.value = storage.isUnlocked()

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
        _state.update { it.copy(status = uiString(R.string.wallet_status_loading), error = null) }

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
            val loadErrorMessage = loadResult.exceptionOrNull()?.message ?: uiString(R.string.wallet_error_load_default)
            _state.update {
                it.copy(
                    status = uiString(R.string.wallet_status_failed_to_load),
                    error = loadErrorMessage,
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

        _state.update { it.copy(initialized = true, status = uiString(R.string.wallet_status_ready), error = null) }

        // Load wallets first, then fetch transactions for active wallet
        refreshWallets()
        refreshSessions()

        // Add delay after wallet loading to avoid rate limiting
        delay(1000)

        // Restore saved active wallet after wallets are loaded
        // Only restore if the saved wallet actually exists in the loaded wallets
        if (!savedActiveWallet.isNullOrBlank() && tonWallets.containsKey(savedActiveWallet)) {
            _state.update { it.copy(activeWalletAddress = savedActiveWallet) }
            Log.d(LOG_TAG, "Restored active wallet selection: $savedActiveWallet")
            // Fetch transactions for the restored active wallet
            refreshTransactions(savedActiveWallet)
        } else {
            if (!savedActiveWallet.isNullOrBlank()) {
                Log.w(LOG_TAG, "Saved active wallet '$savedActiveWallet' not found in loaded wallets, using first wallet instead")
            }
            // Fetch transactions for the first wallet if no saved wallet
            state.value.activeWalletAddress?.let { address ->
                if (tonWallets.containsKey(address)) {
                    refreshTransactions(address)
                } else {
                    Log.w(LOG_TAG, "Active wallet address '$address' not found in loaded wallets")
                }
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
            val fallback = uiString(R.string.wallet_error_load_default)
            _state.update { it.copy(error = error.message ?: fallback) }
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

                val displayName = session.dAppName.ifBlank { uiString(R.string.wallet_event_unknown_dapp) }

                SessionSummary(
                    sessionId = session.sessionId,
                    dAppName = displayName,
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
            _state.update { it.copy(error = uiString(R.string.wallet_error_recovery_phrase_length)) }
            return
        }

        val pending = PendingWalletRecord(
            metadata = WalletMetadata(name.ifBlank { defaultWalletName(state.value.wallets.size) }, network, version),
            mnemonic = cleaned,
        )

        viewModelScope.launch {
            switchNetworkIfNeeded(network)
            pendingWallets.addLast(pending)

            val result = runCatching {
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(cleaned, name)
                    TONWallet.addWithSigner(
                        signer = signer,
                        version = version,
                        network = network,
                    )
                } else {
                    // Create regular mnemonic wallet
                    val walletData = TONWalletData(
                        mnemonic = cleaned,
                        name = pending.metadata.name,
                        version = version,
                        network = network,
                    )
                    TONWallet.add(walletData)
                }
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

                logEvent(
                    R.string.wallet_event_wallet_imported,
                    pending.metadata.name,
                    version,
                    interfaceType.value,
                )
            } else {
                pendingWallets.removeLastOrNull()
                val fallback = uiString(R.string.wallet_error_import_failed)
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: fallback) }
            }
        }
    }

    fun generateWallet(
        name: String,
        network: TONNetwork,
        version: String = DEFAULT_WALLET_VERSION,
        interfaceType: WalletInterfaceType = WalletInterfaceType.MNEMONIC,
    ) {
        // Run mnemonic generation asynchronously to avoid blocking the main thread (ANR)
        viewModelScope.launch {
            _state.update { it.copy(isGeneratingMnemonic = true) }
            val words = try {
                // Use suspend generator that delegates to TONWallet or falls back
                generateMnemonicSuspend()
            } catch (_: Exception) {
                List(24) { DEMO_WORDS.random() }
            } finally {
                _state.update { it.copy(isGeneratingMnemonic = false) }
            }

            val pending = PendingWalletRecord(
                metadata = WalletMetadata(name.ifBlank { defaultWalletName(state.value.wallets.size) }, network, version),
                mnemonic = words,
            )
            switchNetworkIfNeeded(network)
            pendingWallets.addLast(pending)

            val result = runCatching {
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(words, name)
                    TONWallet.addWithSigner(
                        signer = signer,
                        version = version,
                        network = network,
                    )
                } else {
                    // Create regular mnemonic wallet
                    val walletData = TONWalletData(
                        mnemonic = words,
                        name = pending.metadata.name,
                        version = version,
                        network = network,
                    )
                    TONWallet.add(walletData)
                }
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

                logEvent(
                    R.string.wallet_event_wallet_generated,
                    pending.metadata.name,
                    version,
                    interfaceType.value,
                )
            } else {
                pendingWallets.removeLastOrNull()
                val fallback = uiString(R.string.wallet_error_generate_failed)
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: fallback) }
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
                _state.update { it.copy(error = uiString(R.string.wallet_error_no_wallet_selected)) }
                return@launch
            }

            val result = runCatching { wallet.connect(trimmed) }
            result.onSuccess {
                hideUrlPrompt()
                logEvent(R.string.wallet_event_handled_ton_connect_url)
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_ton_connect)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun approveConnect(request: ConnectRequestUi, wallet: WalletSummary) {
        viewModelScope.launch {
            val result = runCatching {
                request.connectRequest?.approve(wallet.address)
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                refreshSessions()
                logEvent(R.string.wallet_event_approved_connect, request.dAppName)
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_approve_connect)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun rejectConnect(request: ConnectRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        viewModelScope.launch {
            val result = runCatching {
                request.connectRequest?.reject(reason)
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                logEvent(R.string.wallet_event_rejected_connect, request.dAppName)
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_reject_connect)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun approveTransaction(request: TransactionRequestUi) {
        viewModelScope.launch {
            val result = runCatching {
                request.transactionRequest?.approve()
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                refreshWallets() // Refresh to show updated balance after transaction is sent
                refreshSessions()
                logEvent(R.string.wallet_event_approved_transaction, request.id)
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_approve_transaction)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun rejectTransaction(request: TransactionRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        viewModelScope.launch {
            val result = runCatching {
                request.transactionRequest?.reject(reason)
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                logEvent(R.string.wallet_event_rejected_transaction, request.id)
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_reject_transaction)
                _state.update { it.copy(error = error.message ?: fallback) }
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
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
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

                logEvent(R.string.wallet_event_sign_data_approved)

                _state.update {
                    it.copy(
                        status = uiString(R.string.wallet_status_signed_success),
                        error = null,
                    )
                }

                // Auto-hide success message after 10 seconds
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        // Only clear if the status is still the success message
                        val successStatus = uiString(R.string.wallet_status_signed_success)
                        if (currentState.status == successStatus) {
                            currentState.copy(status = uiString(R.string.wallet_status_walletkit_ready))
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                Log.e(LOG_TAG, "❌ Sign data approval failed", error)
                val errorMessage = error.message ?: uiString(R.string.wallet_error_unknown)
                logEvent(R.string.wallet_event_sign_data_failed, errorMessage)
                val fallback = uiString(R.string.wallet_error_approve_sign_request)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun rejectSignData(request: SignDataRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        viewModelScope.launch {
            val result = runCatching {
                request.signDataRequest?.reject(reason)
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                Log.d(LOG_TAG, "❌ Rejected sign request ${request.id}: $reason")
                logEvent(R.string.wallet_event_sign_request_rejected)
                _state.update { it.copy(status = uiString(R.string.wallet_status_sign_rejected)) }

                // Auto-hide rejection message after 10 seconds
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        val rejectedStatus = uiString(R.string.wallet_status_sign_rejected)
                        if (currentState.status == rejectedStatus) {
                            currentState.copy(status = uiString(R.string.wallet_status_walletkit_ready))
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_reject_sign_request)
                _state.update { it.copy(error = error.message ?: fallback) }
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
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
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

                logEvent(R.string.wallet_event_sign_data_approved_signer)

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
                val errorMessage = error.message ?: uiString(R.string.wallet_error_unknown)
                logEvent(R.string.wallet_event_sign_data_failed, errorMessage)
                val fallback = uiString(R.string.wallet_error_approve_sign_request)
                _state.update { it.copy(error = error.message ?: fallback) }
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
                request.signDataRequest?.reject(SIGNER_CONFIRMATION_CANCEL_REASON)
                    ?: error(ERROR_REQUEST_OBJECT_NOT_AVAILABLE)
            }

            result.onSuccess {
                dismissSheet()
                Log.d(LOG_TAG, "❌ Rejected sign request ${request.id}: User cancelled signer confirmation")
                logEvent(R.string.wallet_event_sign_request_cancelled)
                _state.update { it.copy(status = uiString(R.string.wallet_status_sign_cancelled)) }

                // Auto-hide cancellation message
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        val cancelledStatus = uiString(R.string.wallet_status_sign_cancelled)
                        if (currentState.status == cancelledStatus) {
                            currentState.copy(status = uiString(R.string.wallet_status_walletkit_ready))
                        } else {
                            currentState
                        }
                    }
                }
            }.onFailure { error ->
                val fallback = uiString(R.string.wallet_error_cancel_sign_request)
                _state.update { it.copy(error = error.message ?: fallback) }
            }
        }
    }

    fun disconnectSession(sessionId: String) {
        viewModelScope.launch {
            try {
                // We need the domain WalletSession instance (from TONWallet) to call the extension
                var disconnected = false
                for (wallet in tonWallets.values) {
                    val sessions = runCatching { wallet.sessions() }.getOrNull() ?: continue
                    val domainSession = sessions.firstOrNull { it.sessionId == sessionId }
                    if (domainSession != null) {
                        domainSession.disconnect()
                        disconnected = true
                        break
                    }
                }

                if (!disconnected) {
                    Log.w(LOG_TAG, "disconnectSession: session not found: $sessionId")
                    _state.update { it.copy(error = uiString(R.string.wallet_error_session_not_found)) }
                    return@launch
                }

                logEvent(R.string.wallet_event_session_disconnected, sessionId)
            } catch (e: Exception) {
                Log.w(LOG_TAG, "Failed to disconnect session $sessionId", e)
                val fallback = uiString(R.string.wallet_error_disconnect_session)
                _state.update { it.copy(error = e.message ?: fallback) }
            } finally {
                // Refresh sessions regardless to update the UI
                refreshSessions()
            }
        }
    }

    fun openSendTransactionSheet(walletAddress: String) {
        val wallet = state.value.wallets.firstOrNull { it.address == walletAddress }
        if (wallet != null) {
            setSheet(SheetState.SendTransaction(wallet))
        }
    }

    fun sendLocalTransaction(walletAddress: String, recipient: String, amount: String, comment: String = "") {
        viewModelScope.launch {
            _state.update { it.copy(isSendingTransaction = true, error = null) }

            val wallet = tonWallets[walletAddress]
            if (wallet == null) {
                _state.update {
                    it.copy(
                        isSendingTransaction = false,
                        error = uiString(R.string.wallet_error_wallet_not_found),
                    )
                }
                return@launch
            }

            // Convert TON to nanoTON
            val amountInNano = try {
                val tonAmount = amount.toBigDecimal()
                (tonAmount * BigDecimal(NANO_TON_MULTIPLIER)).toBigInteger().toString()
            } catch (e: Exception) {
                _state.update {
                    val reason = e.message ?: uiString(R.string.wallet_error_unknown)
                    it.copy(
                        isSendingTransaction = false,
                        error = uiString(R.string.wallet_error_invalid_amount, reason),
                    )
                }
                return@launch
            }

            val result = runCatching { wallet.sendLocalTransaction(recipient, amountInNano, comment) }

            result.onSuccess {
                // Transaction request sent - it will trigger onTransactionRequest event
                // which will show the approval dialog
                _state.update { it.copy(isSendingTransaction = false, error = null) }
                logEvent(R.string.wallet_event_transaction_initiated, walletAddress)
            }.onFailure { error ->
                _state.update {
                    it.copy(
                        isSendingTransaction = false,
                        error = error.message ?: uiString(R.string.wallet_error_send_transaction),
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
                _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
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
            logEvent(R.string.wallet_event_switched_wallet, wallet.name)

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
            val refreshErrorMessage = uiString(R.string.wallet_error_refresh_transactions)
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
                Result.failure(Exception(uiString(R.string.wallet_error_wallet_not_found)))
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
        val unknownAddressLabel = uiString(R.string.wallet_transaction_unknown_party)

        // Transaction already has parsed data from the bridge
        return TransactionDetailUi(
            hash = tx.hash,
            timestamp = tx.timestamp,
            amount = formatNanoTon(tx.amount),
            fee = tx.fee?.let { formatNanoTon(it) } ?: uiString(R.string.wallet_transaction_fee_default),
            fromAddress = tx.sender ?: (if (isOutgoing) walletAddress else unknownAddressLabel),
            toAddress = tx.recipient ?: (if (!isOutgoing) walletAddress else unknownAddressLabel),
            comment = tx.comment,
            status = uiString(R.string.wallet_transaction_status_success), // Transactions from bridge are already filtered/successful
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
        DEFAULT_TON_FORMAT
    }

    fun removeWallet(address: String) {
        viewModelScope.launch {
            val wallet = tonWallets[address]
            if (wallet == null) {
                _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
                return@launch
            }

            val removeResult = runCatching { wallet.remove() }
            if (removeResult.isFailure) {
                val fallback = uiString(R.string.wallet_error_remove_wallet)
                val reason = removeResult.exceptionOrNull()?.message ?: fallback
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

            val walletName = state.value.wallets.firstOrNull { it.address == address }?.name
                ?: uiString(R.string.wallet_default_name_fallback)

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

            logEvent(R.string.wallet_event_wallet_removed, walletName)
        }
    }

    fun renameWallet(address: String, newName: String) {
        val metadata = walletMetadata[address]
        if (metadata == null) {
            _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
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
                    // Preserve interfaceType and createdAt when updating metadata
                    interfaceType = storedWallet.interfaceType,
                    createdAt = storedWallet.createdAt,
                    network = updated.network.toBridgeValue(),
                    version = updated.version,
                )
                storage.saveWallet(address, updatedRecord)
            }

            // Refresh to update UI
            refreshWallets()
            logEvent(R.string.wallet_event_wallet_renamed, newName)
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
                    // Preserve stored interfaceType and createdAt
                    interfaceType = storedRecord.interfaceType,
                    createdAt = storedRecord.createdAt,
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
            name = demoWalletName,
            network = currentNetwork,
            version = DEFAULT_WALLET_VERSION,
        )
        val pendingRecord = PendingWalletRecord(metadata = metadata, mnemonic = DEMO_MNEMONIC)
        pendingWallets.addLast(pendingRecord)

        val walletData = TONWalletData(
            mnemonic = DEMO_MNEMONIC,
            name = demoWalletName,
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
            val fallback = uiString(R.string.wallet_error_prepare_demo_wallet)
            _state.update { it.copy(error = error.message ?: fallback) }
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
        val fallbackDAppName = uiString(R.string.wallet_event_unknown_dapp)
        val permissionUnknownName = uiString(R.string.wallet_permission_unknown_name)
        val permissionDefaultTitle = uiString(R.string.wallet_permission_default_title)
        val uiRequest = ConnectRequestUi(
            id = request.hashCode().toString(), // Use object hashCode as ID
            dAppName = dAppInfo?.name ?: fallbackDAppName,
            dAppUrl = dAppInfo?.url ?: "",
            manifestUrl = dAppInfo?.manifestUrl ?: "",
            iconUrl = dAppInfo?.iconUrl,
            permissions = request.permissions.map { perm ->
                ConnectPermissionUi(
                    name = perm.name ?: permissionUnknownName,
                    title = perm.title ?: permissionDefaultTitle,
                    description = perm.description ?: "",
                )
            },
            requestedItems = request.permissions.mapNotNull { it.name },
            raw = org.json.JSONObject(), // Not needed with this API
            connectRequest = request, // Store for direct approve/reject
        )

        setSheet(SheetState.Connect(uiRequest))
        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        logEvent(R.string.wallet_event_connect_request, eventDAppName)
    }

    private fun onTransactionRequest(request: TONWalletTransactionRequest) {
        Log.d(LOG_TAG, "=== onTransactionRequest called ===")
        // Extract wallet address from active wallet
        val walletAddress = state.value.activeWalletAddress ?: ""
        val dAppInfo = request.dAppInfo
        val fallbackDAppName = uiString(R.string.wallet_event_generic_dapp)

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
            dAppName = dAppInfo?.name ?: fallbackDAppName,
            validUntil = request.validUntil,
            messages = messages,
            preview = null,
            raw = org.json.JSONObject(),
            transactionRequest = request,
        )

        Log.d(LOG_TAG, "Setting sheet to Transaction state with ${messages.size} messages")
        setSheet(SheetState.Transaction(uiRequest))
        Log.d(LOG_TAG, "Sheet state updated: ${state.value.sheetState}")
        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        logEvent(R.string.wallet_event_transaction_request, eventDAppName)
    }

    private fun onSignDataRequest(request: TONWalletSignDataRequest) {
        val dAppInfo = request.dAppInfo
        val fallbackDAppName = uiString(R.string.wallet_event_generic_dapp)

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
        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        logEvent(R.string.wallet_event_sign_data_request, eventDAppName)
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

    private fun defaultWalletName(index: Int): String = uiString(R.string.wallet_default_name, index + 1)

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

    private suspend fun generateMnemonicSuspend(): List<String> = try {
        TONWallet.generateMnemonic(24)
    } catch (_: Exception) {
        List(24) { DEMO_WORDS.random() }
    }

    /**
     * Creates a hardware wallet signer using WalletConnect.
     *
     * This is called when user selects "SIGNER" interface type during wallet import.
     * It launches the WalletConnect flow to connect to a hardware wallet like SafePal.
     *
     * Note: mnemonic parameter is ignored for hardware wallets (no need for seed phrase).
     */

    /**
     * Create a custom signer that requires user confirmation for each signing operation.
     * This demonstrates the WalletSigner interface for external/hardware wallet integration.
     *
     * In production, this would connect to a real hardware wallet like Ledger or SafePal.
     * For the demo, it derives the public key from mnemonic but requires explicit user confirmation via UI.
     */
    private suspend fun createDemoSigner(mnemonic: List<String>, walletName: String): io.ton.walletkit.domain.model.WalletSigner {
        Log.d(LOG_TAG, "Creating custom signer for wallet: $walletName")

        // In production, you would:
        // 1. Connect to hardware wallet (Ledger, SafePal, etc.)
        // 2. Get public key from hardware device
        // 3. Return a signer that forwards sign requests to the device
        //
        // For demo purposes, we derive the public key from mnemonic using SDK's utility method.
        // This avoids creating and immediately deleting a temporary wallet.

        // Use SDK's new derivePublicKey method to get public key without creating a wallet
        val publicKey = TONWallet.derivePublicKey(mnemonic)

        Log.d(LOG_TAG, "Derived public key for signer wallet: ${publicKey.take(16)}...")

        // Create and return custom signer
        // The SDK's WalletSigner interface will handle the actual signing
        // and our UI confirmation flow will trigger before each signature
        return object : io.ton.walletkit.domain.model.WalletSigner {
            override val publicKey: String = publicKey

            override suspend fun sign(data: ByteArray): ByteArray {
                // This will never actually be called directly -
                // The SDK manages the signing through the bridge
                // User confirmation happens via the pendingSignerConfirmation UI flow
                throw UnsupportedOperationException(ERROR_DIRECT_SIGNING_UNSUPPORTED)
            }
        }
    }

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
        private const val NANO_TON_MULTIPLIER = "1000000000"
        private const val DEFAULT_TON_FORMAT = "0.0000"
        private const val ERROR_REQUEST_OBJECT_NOT_AVAILABLE = "Request object not available"
        private const val DEFAULT_REJECTION_REASON = "User rejected"
        private const val SIGNER_CONFIRMATION_CANCEL_REASON = "User cancelled signer confirmation"
        private const val ERROR_DIRECT_SIGNING_UNSUPPORTED = "Direct signing not supported - use SDK's transaction/signData methods"

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

        fun factory(
            application: Application,
            storage: DemoAppStorage,
            sdkEvents: SharedFlow<TONWalletKitEvent>,
            sdkInitialized: SharedFlow<Boolean>,
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = WalletKitViewModel(application, storage, sdkEvents, sdkInitialized) as T
        }
    }

    // ========== Password Management ==========

    fun setupPassword(password: String) {
        viewModelScope.launch {
            try {
                storage.setPassword(password)
                _isPasswordSet.value = true
                _isUnlocked.value = true
                storage.setUnlocked(true)

                // Wait for SDK to initialize and wallets to load
                sdkInitialized.first { it }
                delay(500) // Give time for wallets to load

                // If no wallets exist, automatically open add wallet sheet
                if (_state.value.wallets.isEmpty()) {
                    _state.update { it.copy(sheetState = SheetState.AddWallet) }
                }
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to setup password", e)
                val reason = e.message ?: uiString(R.string.wallet_error_unknown)
                _state.update { it.copy(error = uiString(R.string.wallet_error_setup_password, reason)) }
            }
        }
    }

    fun unlockWallet(password: String): Boolean = if (storage.verifyPassword(password)) {
        _isUnlocked.value = true
        storage.setUnlocked(true)

        // If no wallets exist, automatically open add wallet sheet
        viewModelScope.launch {
            sdkInitialized.first { it }
            delay(500) // Give time for wallets to load

            if (_state.value.wallets.isEmpty()) {
                _state.update { it.copy(sheetState = SheetState.AddWallet) }
            }
        }
        true
    } else {
        _state.update { it.copy(error = uiString(R.string.wallet_error_incorrect_password)) }
        false
    }

    fun lockWallet() {
        _isUnlocked.value = false
        storage.setUnlocked(false)
    }

    fun resetWallet() {
        viewModelScope.launch {
            try {
                // Remove all wallets from SDK first
                val allWallets = tonWallets.values.toList()
                allWallets.forEach { wallet ->
                    runCatching { wallet.remove() }.onFailure {
                        Log.w(LOG_TAG, "Failed to remove wallet during reset", it)
                    }
                }

                // Clear local caches
                tonWallets.clear()
                walletMetadata.clear()
                transactionCache.clearAll()

                // Clear all stored data (including password)
                storage.clearAll()

                // Reset state
                _isPasswordSet.value = false
                _isUnlocked.value = false
                _state.update {
                    WalletUiState(
                        status = uiString(R.string.wallet_status_wallet_reset),
                        wallets = emptyList(),
                    )
                }

                Log.d(LOG_TAG, "Wallet reset complete - all data cleared")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to reset wallet", e)
                val reason = e.message ?: uiString(R.string.wallet_error_unknown)
                _state.update { it.copy(error = uiString(R.string.wallet_error_reset_wallet, reason)) }
            }
        }
    }
}
