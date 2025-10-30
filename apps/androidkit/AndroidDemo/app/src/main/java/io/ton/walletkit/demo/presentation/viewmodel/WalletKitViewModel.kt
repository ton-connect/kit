package io.ton.walletkit.demo.presentation.viewmodel

import android.app.Application
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
import io.ton.walletkit.demo.presentation.model.TransactionMessageUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.state.SheetState
import io.ton.walletkit.demo.presentation.state.WalletUiState
import io.ton.walletkit.demo.presentation.util.TimestampParser
import io.ton.walletkit.demo.presentation.util.TonFormatter
import io.ton.walletkit.demo.presentation.util.TransactionDetailMapper
import io.ton.walletkit.demo.presentation.util.TransactionDiffUtil
import io.ton.walletkit.demo.presentation.util.UrlSanitizer
import io.ton.walletkit.domain.model.TONNetwork
import io.ton.walletkit.domain.model.TONWalletData
import io.ton.walletkit.domain.model.WalletSession
import io.ton.walletkit.domain.model.WalletSigner
import io.ton.walletkit.presentation.TONWallet
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import io.ton.walletkit.presentation.extensions.disconnect
import io.ton.walletkit.presentation.request.TONWalletConnectionRequest
import io.ton.walletkit.presentation.request.TONWalletSignDataRequest
import io.ton.walletkit.presentation.request.TONWalletTransactionRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
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
    private var lastPersistedActiveWallet: String? = null

    // NFTs ViewModel for active wallet
    private val _nftsViewModel = MutableStateFlow<NFTsListViewModel?>(null)
    val nftsViewModel: StateFlow<NFTsListViewModel?> = _nftsViewModel.asStateFlow()

    private fun uiString(@StringRes resId: Int, vararg args: Any): String = application.getString(resId, *args)

    private fun logEvent(@StringRes messageRes: Int, vararg args: Any) {
        logEvent(uiString(messageRes, *args))
    }

    /**
     * Get the shared TONWalletKit instance used across the demo.
     */
    private suspend fun getKit(): io.ton.walletkit.presentation.TONWalletKit = io.ton.walletkit.demo.core.TONWalletKitHelper.mainnet(application)

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
        Log.d(LOG_TAG, "bootstrap: loading user preferences")
        val userPrefs = storage.loadUserPreferences()
        val savedActiveWallet = userPrefs?.activeWalletAddress
        lastPersistedActiveWallet = savedActiveWallet
        Log.d(LOG_TAG, "Loaded saved active wallet: $savedActiveWallet")

        // SDK already initialized in Application
        currentNetwork = DEFAULT_NETWORK

        // Load wallets from SDK (auto-restored from persistent storage)
        val loadResult = runCatching {
            Log.d(LOG_TAG, "bootstrap: requesting wallets from SDK (initial)")
            val wallets = getKit().getWallets()
            wallets.forEach { wallet ->
                wallet.address?.let { address ->
                    tonWallets[address] = wallet
                }
            }
            Log.d(LOG_TAG, "bootstrap: initial SDK wallet count = ${wallets.size}")
            Log.d(LOG_TAG, "bootstrap: cached addresses after initial load = ${tonWallets.keys}")
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

        if (tonWallets.isEmpty()) {
            Log.d(LOG_TAG, "bootstrap: no wallets from SDK, attempting rehydrate from storage")
            val restored = rehydrateWalletsFromStorage()
            Log.d(LOG_TAG, "bootstrap: rehydrate restored=$restored, cached=${tonWallets.keys}")
        }

        // Reload wallets from SDK (after any external changes)
        Log.d(LOG_TAG, "bootstrap: refreshing wallet list post-migration check")
        val walletsAfterMigration = getKit().getWallets()
        tonWallets.clear()
        val metadataCorrections = mutableListOf<String>()
        for (wallet in walletsAfterMigration) {
            val address = wallet.address ?: continue
            tonWallets[address] = wallet
            if (walletMetadata[address] == null) {
                Log.d(LOG_TAG, "bootstrap: metadata missing for $address, loading from storage")
                val storedRecord = storage.loadWallet(address)
                if (storedRecord != null) {
                    Log.d(LOG_TAG, "bootstrap: restored metadata for $address from storage (name='${storedRecord.name}')")
                    walletMetadata[address] = WalletMetadata(
                        name = storedRecord.name,
                        network = storedRecord.network.toTonNetwork(currentNetwork),
                        version = storedRecord.version,
                    )
                } else {
                    val fallback = WalletMetadata(
                        name = defaultWalletName(walletMetadata.size),
                        network = currentNetwork,
                        version = DEFAULT_WALLET_VERSION,
                    )
                    walletMetadata[address] = fallback
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

        Log.d(LOG_TAG, "bootstrap: cached addresses after migration = ${tonWallets.keys}")
        Log.d(LOG_TAG, "After migration: ${walletsAfterMigration.size} wallets in SDK")

        _state.update { it.copy(initialized = true, status = uiString(R.string.wallet_status_ready), error = null) }

        // Load wallets and sessions concurrently and wait for both to complete
        coroutineScope {
            val walletsJob = async { refreshWallets() }
            val sessionsJob = async { refreshSessions() }
            walletsJob.await()
            sessionsJob.await()
        }

        // Restore saved active wallet after wallets are loaded
        // Only restore if the saved wallet actually exists in the loaded wallets
        if (!savedActiveWallet.isNullOrBlank() && tonWallets.containsKey(savedActiveWallet)) {
            _state.update { it.copy(activeWalletAddress = savedActiveWallet) }
            Log.d(LOG_TAG, "Restored active wallet selection: $savedActiveWallet")
            // Update NFTs ViewModel for active wallet
            updateNftsViewModel(savedActiveWallet)
            // Fetch transactions for the restored active wallet
            refreshTransactions(savedActiveWallet)
        } else {
            if (!savedActiveWallet.isNullOrBlank()) {
                Log.w(LOG_TAG, "Saved active wallet '$savedActiveWallet' not found in loaded wallets, using first wallet instead")
            }
            // Fetch transactions for the first wallet if no saved wallet
            state.value.activeWalletAddress?.let { address ->
                if (tonWallets.containsKey(address)) {
                    // Update NFTs ViewModel for active wallet
                    updateNftsViewModel(address)
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
            // Browser events - logged but not handled here as BrowserSheet manages WebView directly
            is TONWalletKitEvent.BrowserPageStarted,
            is TONWalletKitEvent.BrowserPageFinished,
            is TONWalletKitEvent.BrowserError,
            is TONWalletKitEvent.BrowserBridgeRequest,
            -> {
                // These events are informational only - BrowserSheet manages the WebView lifecycle
                Log.d(LOG_TAG, "Browser event: ${event::class.simpleName}")
            }
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
        Log.d(
            LOG_TAG,
            "refreshWallets: start active=${state.value.activeWalletAddress} cached=${tonWallets.keys}",
        )
        val summaries = runCatching { loadWalletSummaries() }
        summaries.onSuccess { wallets ->
            val now = System.currentTimeMillis()
            Log.d(LOG_TAG, "refreshWallets: loaded ${wallets.size} summaries -> ${wallets.map { it.address }}")

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

            if (activeAddress != newActiveAddress || lastPersistedActiveWallet != newActiveAddress) {
                persistActiveWalletPreference(newActiveAddress)
            }
        }.onFailure { error ->
            Log.e(LOG_TAG, "refreshWallets: loadWalletSummaries failed", error)
            val fallback = uiString(R.string.wallet_error_load_default)
            _state.update { it.copy(error = error.message ?: fallback) }
        }
        _state.update { it.copy(isLoadingWallets = false) }
        Log.d(
            LOG_TAG,
            "refreshWallets: done active=${_state.value.activeWalletAddress} wallets=${_state.value.wallets.map { it.address }}",
        )
    }

    private suspend fun refreshSessions() {
        _state.update { it.copy(isLoadingSessions = true) }

        // Aggregate sessions from all wallets
        val allSessions = mutableListOf<WalletSession>()
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
            val sessionUrl = UrlSanitizer.sanitize(session.dAppUrl)
            val sessionManifest = UrlSanitizer.sanitize(session.manifestUrl)
            val sessionIcon = UrlSanitizer.sanitize(session.iconUrl)

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
                createdAt = TimestampParser.parse(session.createdAtIso),
                lastActivity = TimestampParser.parse(session.lastActivityIso),
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

    fun openBrowser(url: String) {
        setSheet(SheetState.Browser(url))
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
                val kit = getKit()
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(cleaned, name)
                    TONWallet.addWithSigner(
                        kit = kit,
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
                    kit.addWallet(walletData)
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
                        .onSuccess { Log.d(LOG_TAG, "importWallet: saved wallet record for $address") }
                        .onFailure { Log.e(LOG_TAG, "importWallet: failed to save wallet record for $address", it) }
                }

                // Automatically switch to the newly imported wallet
                newWallet?.address?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    persistActiveWalletPreference(address)
                    updateNftsViewModel(address)
                    Log.d(LOG_TAG, "Auto-switched to newly imported wallet: $address")
                }
                refreshWallets()
                dismissSheet()

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
                val kit = getKit()
                TONWallet.generateMnemonic(kit, 24)
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Mnemonic generation failed", e)
                _state.update { it.copy(isGeneratingMnemonic = false, error = uiString(R.string.wallet_error_generate_failed)) }
                return@launch
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
                val kit = getKit()
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(words, name)
                    TONWallet.addWithSigner(
                        kit = kit,
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
                    kit.addWallet(walletData)
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
                        .onSuccess { Log.d(LOG_TAG, "generateWallet: saved wallet record for $address") }
                        .onFailure { Log.e(LOG_TAG, "generateWallet: failed to save wallet record for $address", it) }
                }

                // Automatically switch to the newly generated wallet
                newWallet?.address?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    persistActiveWalletPreference(address)
                    updateNftsViewModel(address)
                    Log.d(LOG_TAG, "Auto-switched to newly generated wallet: $address")
                }
                refreshWallets()
                dismissSheet()

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
                // Check if we should restore the browser sheet
                val previousSheet = _state.value.previousSheet
                if (previousSheet is SheetState.Browser) {
                    // Restore browser so dApp can show connection confirmation
                    _state.update { it.copy(sheetState = previousSheet, previousSheet = null) }
                } else {
                    // No browser to restore, dismiss the sheet
                    dismissSheet()
                }

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
                // Check if we should restore the browser sheet
                val previousSheet = _state.value.previousSheet
                if (previousSheet is SheetState.Browser) {
                    // Restore browser so user can see the dApp
                    _state.update { it.copy(sheetState = previousSheet, previousSheet = null) }
                } else {
                    // No browser to restore, dismiss the sheet
                    dismissSheet()
                }

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
                    delay(HIDE_MESSAGE_MS)
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
                    delay(HIDE_MESSAGE_MS)
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
                    delay(HIDE_MESSAGE_MS)
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
                val kit = getKit()
                for (wallet in tonWallets.values) {
                    val sessions = runCatching { wallet.sessions() }.getOrNull() ?: continue
                    val domainSession = sessions.firstOrNull { it.sessionId == sessionId }
                    if (domainSession != null) {
                        domainSession.disconnect(kit)
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
                TonFormatter.tonToNano(amount)
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
            persistActiveWalletPreference(address)

            // Update NFTs ViewModel for new active wallet
            updateNftsViewModel(address)

            // Refresh wallet state to get latest balance, then transactions
            refreshWallets()
            logEvent(R.string.wallet_event_switched_wallet, wallet.name)

            // Immediately fetch transactions after wallets refresh completes
            refreshTransactions(address)
        }
    }

    /**
     * Persist the active wallet address to storage (nullable to clear preference).
     */
    private fun persistActiveWalletPreference(address: String?) {
        if (lastPersistedActiveWallet == address) {
            Log.d(
                LOG_TAG,
                if (address != null) {
                    "persistActiveWalletPreference: unchanged ($address), skip write"
                } else {
                    "persistActiveWalletPreference: unchanged (null), skip write"
                },
            )
            return
        }

        viewModelScope.launch {
            try {
                Log.d(LOG_TAG, "persistActiveWalletPreference: writing preference $address")
                val updatedPrefs = UserPreferences(
                    activeWalletAddress = address,
                )
                storage.saveUserPreferences(updatedPrefs)
                lastPersistedActiveWallet = address
                Log.d(
                    LOG_TAG,
                    if (address != null) {
                        "Saved active wallet preference: $address"
                    } else {
                        "Cleared active wallet preference"
                    },
                )
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to save active wallet preference", e)
            }
        }
    }

    /**
     * Update the NFTs ViewModel for the given wallet address.
     */
    private fun updateNftsViewModel(address: String?) {
        if (address == null) {
            _nftsViewModel.value = null
            return
        }

        val wallet = tonWallets[address]
        if (wallet == null) {
            Log.w(LOG_TAG, "updateNftsViewModel: wallet not found for address $address")
            _nftsViewModel.value = null
            return
        }

        _nftsViewModel.value = NFTsListViewModel(wallet)
        Log.d(LOG_TAG, "updateNftsViewModel: created NFTsListViewModel for $address")
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
        val detail = TransactionDetailMapper.toDetailUi(
            tx = tx,
            walletAddress = walletAddress,
            unknownAddressLabel = uiString(R.string.wallet_transaction_unknown_party),
            defaultFeeLabel = uiString(R.string.wallet_transaction_fee_default),
            successStatusLabel = uiString(R.string.wallet_transaction_status_success),
        )
        _state.update { it.copy(sheetState = SheetState.TransactionDetail(detail)) }
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

            runCatching { storage.clear(address) }
                .onSuccess { Log.d(LOG_TAG, "removeWallet: cleared storage entry for $address") }
                .onFailure { Log.w(LOG_TAG, "removeWallet: failed to clear storage for $address", it) }

            // Clear transaction cache for removed wallet
            transactionCache.clear(address)

            walletMetadata.remove(address)

            val walletName = state.value.wallets.firstOrNull { it.address == address }?.name
                ?: uiString(R.string.wallet_default_name_fallback)

            val previousActiveAddress = state.value.activeWalletAddress
            var updatedActiveAddress: String? = null
            _state.update {
                val filteredWallets = it.wallets.filterNot { summary -> summary.address == address }
                val newActiveAddress = when {
                    filteredWallets.isEmpty() -> null
                    it.activeWalletAddress == address -> filteredWallets.first().address
                    else -> it.activeWalletAddress
                }
                updatedActiveAddress = newActiveAddress
                it.copy(
                    wallets = filteredWallets,
                    activeWalletAddress = newActiveAddress,
                    isWalletSwitcherExpanded = if (filteredWallets.size <= 1) false else it.isWalletSwitcherExpanded,
                )
            }

            if (previousActiveAddress != updatedActiveAddress) {
                persistActiveWalletPreference(updatedActiveAddress)
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
                runCatching { storage.saveWallet(address, updatedRecord) }
                    .onSuccess { Log.d(LOG_TAG, "renameWallet: updated record for $address") }
                    .onFailure { Log.e(LOG_TAG, "renameWallet: failed to update record for $address", it) }
            }

            // Refresh to update UI
            refreshWallets()
            logEvent(R.string.wallet_event_wallet_renamed, newName)
        }
    }

    private suspend fun loadWalletSummaries(): List<WalletSummary> {
        // Get wallets from SDK and update cache
        val wallets = getKit().getWallets()
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
            Log.d(
                LOG_TAG,
                "loadWalletSummaries: metadata for $address name='${metadata.name}' network=${metadata.network} version=${metadata.version}",
            )

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
            val formatted = balance?.let { TonFormatter.formatTon(it) }

            // Use cached transactions only - don't fetch on every balance refresh
            // Transactions will be fetched explicitly via refreshTransactions()
            val cachedTransactions = transactionCache.get(address)

            // Get sessions connected to this wallet
            val walletSessions = _state.value.sessions.filter { session ->
                session.walletAddress == address
            }

            // Get creation date from stored record
            val storedRecord = storage.loadWallet(address)
            Log.d(
                LOG_TAG,
                "loadWalletSummaries: storage record for $address present=${storedRecord != null}",
            )
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
        }
        return result
    }

    private suspend fun ensureMetadataForAddress(address: String, publicKey: String?): WalletMetadata {
        walletMetadata[address]?.let { return it }

        val pending = pendingWallets.removeLastOrNull()
        Log.d(
            LOG_TAG,
            "ensureMetadataForAddress: address=$address pending=${pending != null} stored=${walletMetadata.containsKey(address)}",
        )
        val storedRecord = storage.loadWallet(address)
        if (storedRecord != null) {
            Log.d(
                LOG_TAG,
                "ensureMetadataForAddress: storage hit for $address name='${storedRecord.name}' network='${storedRecord.network}' version='${storedRecord.version}'",
            )
        } else {
            Log.d(LOG_TAG, "ensureMetadataForAddress: no stored record for $address")
        }
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
                    // Preserve stored interfaceType and createdAt
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

    private suspend fun rehydrateWalletsFromStorage(): Boolean {
        val stored = storage.loadAllWallets()
        if (stored.isEmpty()) {
            Log.d(LOG_TAG, "rehydrate: storage empty, nothing to restore")
            return false
        }

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
            val version = record.version.ifBlank { DEFAULT_WALLET_VERSION }
            val name = record.name.ifBlank { defaultWalletName(restoredCount) }

            val walletData = TONWalletData(
                mnemonic = record.mnemonic,
                name = name,
                version = version,
                network = networkEnum,
            )

            val result = runCatching { getKit().addWallet(walletData) }
            result.onSuccess { wallet ->
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

    private suspend fun reinitializeForNetwork(
        target: TONNetwork,
    ) {
        // Note: SDK is initialized globally, network switching not supported in current public API
        // For now, just update local state
        currentNetwork = target
        walletMetadata.clear()
        pendingWallets.clear()
    }

    private suspend fun switchNetworkIfNeeded(target: TONNetwork) {
        if (target == currentNetwork) return
        reinitializeForNetwork(target)
        refreshAll()
    }

    private fun setSheet(sheet: SheetState, savePrevious: Boolean = false) {
        _state.update { currentState ->
            val previousSheet = if (savePrevious) currentState.sheetState else null
            currentState.copy(sheetState = sheet, previousSheet = previousSheet)
        }
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

        // Save previous sheet (e.g., Browser) so we can restore it after approval/rejection
        val currentSheet = _state.value.sheetState
        val shouldSavePrevious = currentSheet is SheetState.Browser
        setSheet(SheetState.Connect(uiRequest), savePrevious = shouldSavePrevious)

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

    /**
     * Create a custom signer that requires explicit user confirmation for each signing operation.
     *
     * This demonstrates the WalletSigner interface for external/remote signing scenarios:
     * - Watch-only wallets (where private keys are stored elsewhere)
     * - Multi-signature wallet coordinators
     * - Remote signing services
     * - Custom authorization flows
     *
     * NOTE: This interface is NOT suitable for hardware wallets like Ledger, which:
     * - Only sign complete transactions (not arbitrary data)
     * - Work at a higher level (transaction-level, not raw bytes)
     * - Cannot sign arbitrary payloads from signData requests
     *
     * For hardware wallet integration, use transaction-only signing at the wallet adapter level.
     *
     * This is called when user selects "SIGNER" interface type during wallet import.
     * For the demo, it derives the public key from mnemonic but requires explicit user confirmation via UI.
     */
    private suspend fun createDemoSigner(mnemonic: List<String>, walletName: String): WalletSigner {
        Log.d(LOG_TAG, "Creating custom signer for wallet: $walletName")

        // In production, you would:
        // 1. Connect to remote signing service or watch-only wallet backend
        // 2. Get public key from the remote service
        // 3. Return a signer that forwards sign requests to the service
        //
        // For demo purposes, we derive the public key from mnemonic using SDK's utility method.
        // This avoids creating and immediately deleting a temporary wallet.

        // Use SDK's new derivePublicKey method to get public key without creating a wallet
        val kit = getKit()
        val publicKey = TONWallet.derivePublicKey(kit, mnemonic)

        Log.d(LOG_TAG, "Derived public key for signer wallet: ${publicKey.take(16)}...")

        val signerMnemonic = mnemonic.toList()

        // Create and return custom signer backed by the provided mnemonic
        // so the demo app can satisfy TonProof/transaction signatures.
        return object : WalletSigner {
            override val publicKey: String = publicKey

            override suspend fun sign(data: ByteArray): ByteArray {
                Log.d(
                    LOG_TAG,
                    "Demo signer signing ${data.size} bytes for wallet=$walletName (used for TonProof/transactions)",
                )
                val kit = getKit()
                return TONWallet.signDataWithMnemonic(
                    kit = kit,
                    mnemonic = signerMnemonic,
                    data = data,
                    mnemonicType = "ton",
                )
            }
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
                lastPersistedActiveWallet = null

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

    companion object {
        private const val BALANCE_REFRESH_MS = 20_000L
        private const val HIDE_MESSAGE_MS = 10_000L
        private const val MAX_EVENT_LOG = 12
        private const val DEFAULT_WALLET_VERSION = "v4r2"
        private const val TRANSACTION_FETCH_LIMIT = 20
        private val DEFAULT_NETWORK = TONNetwork.MAINNET
        private const val LOG_TAG = "WalletKitVM"
        private const val ERROR_REQUEST_OBJECT_NOT_AVAILABLE = "Request object not available"
        private const val DEFAULT_REJECTION_REASON = "User rejected"
        private const val SIGNER_CONFIRMATION_CANCEL_REASON = "User cancelled signer confirmation"
        private const val ERROR_DIRECT_SIGNING_UNSUPPORTED = "Direct signing not supported - use SDK's transaction/signData methods"

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
}
