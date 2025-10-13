package io.ton.walletkit.demo

import android.os.Build
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.demo.cache.TransactionCache
import io.ton.walletkit.demo.model.ConnectPermissionUi
import io.ton.walletkit.demo.model.ConnectRequestUi
import io.ton.walletkit.demo.model.PendingWalletRecord
import io.ton.walletkit.demo.model.SessionSummary
import io.ton.walletkit.demo.model.SignDataRequestUi
import io.ton.walletkit.demo.model.TonNetwork
import io.ton.walletkit.demo.model.TransactionDetailUi
import io.ton.walletkit.demo.model.TransactionMessageUi
import io.ton.walletkit.demo.model.TransactionRequestUi
import io.ton.walletkit.demo.model.WalletMetadata
import io.ton.walletkit.demo.model.WalletSummary
import io.ton.walletkit.demo.state.SheetState
import io.ton.walletkit.demo.state.WalletUiState
import io.ton.walletkit.demo.storage.DemoAppStorage
import io.ton.walletkit.demo.storage.UserPreferences
import io.ton.walletkit.demo.storage.WalletRecord
import io.ton.walletkit.demo.util.TransactionDiffUtil
import io.ton.walletkit.presentation.WalletKitEngine
import io.ton.walletkit.presentation.config.WalletKitBridgeConfig
import io.ton.walletkit.presentation.event.WalletKitEvent
import io.ton.walletkit.presentation.listener.WalletKitEventHandler
import io.ton.walletkit.presentation.model.WalletAccount
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.Closeable
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.Locale
import java.util.TimeZone
import kotlin.collections.ArrayDeque
import kotlin.collections.firstOrNull

class WalletKitViewModel(
    private val engine: WalletKitEngine,
    private val storage: DemoAppStorage,
) : ViewModel() {

    private val _state = MutableStateFlow(
        WalletUiState(
            status = "Initializing WalletKit…",
        ),
    )
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    private var bridgeListener: Closeable? = null
    private var balanceJob: Job? = null
    private var currentNetwork: TonNetwork = DEFAULT_NETWORK

    private val walletMetadata = mutableMapOf<String, WalletMetadata>()
    private val pendingWallets = ArrayDeque<PendingWalletRecord>()

    // Transaction cache for efficient list updates
    private val transactionCache = TransactionCache()

    init {
        viewModelScope.launch { bootstrap() }
    }

    private suspend fun bootstrap() {
        _state.update { it.copy(status = "Initializing WalletKit…", error = null) }

        // Load user preferences (including active wallet address)
        val userPrefs = storage.loadUserPreferences()
        val savedActiveWallet = userPrefs?.activeWalletAddress
        Log.d(LOG_TAG, "Loaded saved active wallet: $savedActiveWallet")

        // Initialize bridge with default network (wallets will be auto-restored by bridge)
        currentNetwork = DEFAULT_NETWORK

        val initResult = runCatching {
            engine.init(
                WalletKitBridgeConfig(
                    network = currentNetwork.asBridgeValue(),
                    tonClientEndpoint = networkEndpoints(currentNetwork).tonClientEndpoint,
                    tonApiUrl = networkEndpoints(currentNetwork).tonApiUrl,
                    bridgeUrl = networkEndpoints(currentNetwork).bridgeUrl,
                    bridgeName = networkEndpoints(currentNetwork).bridgeName,
                    // Storage is always persistent - no allowMemoryStorage parameter
                ),
            )
        }

        if (initResult.isFailure) {
            _state.update {
                it.copy(
                    status = "WalletKit failed to initialize",
                    error = initResult.exceptionOrNull()?.message ?: "Initialization error",
                )
            }
            return
        }

        // Restore wallets from secure storage into the bridge if needed
        migrateLegacyWallets()

        // Use typed event handler
        bridgeListener = engine.addEventHandler(object : WalletKitEventHandler {
            override fun handleEvent(event: WalletKitEvent) {
                onBridgeEvent(event)
            }
        })
        _state.update { it.copy(initialized = true, status = "WalletKit ready", error = null) }

        refreshAll()

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
     * Restore wallets that were persisted in secure Android storage.
     * Runs on every initialization to ensure wallets survive bridge resets.
     */
    private suspend fun migrateLegacyWallets() {
        try {
            val storedWallets = storage.loadAllWallets()

            if (storedWallets.isEmpty()) {
                Log.d(LOG_TAG, "No legacy wallets to migrate")
                return
            }

            // Check if bridge already has wallets
            val bridgeWallets = runCatching { engine.getWallets() }.getOrDefault(emptyList())
            val existingAddresses = bridgeWallets.mapTo(mutableSetOf()) { it.address }

            Log.d(
                LOG_TAG,
                "Restoring ${storedWallets.size} wallets from secure storage (bridge has ${existingAddresses.size})",
            )

            var migratedCount = 0
            storedWallets.forEach { (address, record) ->
                try {
                    if (record.mnemonic.isEmpty()) {
                        Log.w(LOG_TAG, "Skipping wallet with empty mnemonic: $address")
                        return@forEach
                    }

                    val network = TonNetwork.fromBridge(record.network, currentNetwork)
                    val version = record.version ?: DEFAULT_WALLET_VERSION

                    val displayName = record.name ?: defaultWalletName(walletMetadata.size)

                    if (existingAddresses.contains(address)) {
                        Log.d(LOG_TAG, "Wallet already present in bridge, skipping add: $address")
                    } else {
                        // Add to bridge (keep data in secure storage for future restores)
                        engine.addWalletFromMnemonic(
                            words = record.mnemonic,
                            name = displayName,
                            version = version,
                            network = network.asBridgeValue(),
                        )
                        migratedCount++
                        existingAddresses.add(address)
                        Log.d(LOG_TAG, "Restored wallet: $address (${record.name ?: "unnamed"})")
                    }

                    // Store metadata for UI
                    walletMetadata[address] = WalletMetadata(
                        name = displayName,
                        network = network,
                        version = version,
                    )
                } catch (e: Exception) {
                    Log.e(LOG_TAG, "Failed to migrate wallet: $address", e)
                }
            }

            if (migratedCount > 0) {
                Log.d(
                    LOG_TAG,
                    "Restoration complete: $migratedCount/${storedWallets.size} wallets added to bridge",
                )
            }
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

    fun refreshWallets() {
        viewModelScope.launch {
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
    }

    fun refreshSessions() {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingSessions = true) }
            val result = runCatching { engine.listSessions() }
            result.onSuccess { sessions ->
                Log.d(LOG_TAG, "Loaded ${sessions.size} sessions from bridge")
                sessions.forEach { session ->
                    Log.d(
                        LOG_TAG,
                        "Session: id=${session.sessionId}, dApp=${session.dAppName}, " +
                            "wallet=${session.walletAddress}, url=${session.dAppUrl}, manifest=${session.manifestUrl}, " +
                            "icon=${session.iconUrl}",
                    )
                }
                val mapped = sessions.mapNotNull { session ->
                    val sessionUrl = sanitizeUrl(session.dAppUrl)
                    val sessionManifest = sanitizeUrl(session.manifestUrl)
                    val sessionIcon = sanitizeUrl(session.iconUrl)

                    // Skip sessions with no metadata (appears disconnected)
                    val appearsDisconnected = sessionUrl == null && sessionManifest == null
                    if (appearsDisconnected && session.sessionId.isNotBlank()) {
                        Log.d(
                            LOG_TAG,
                            "Bridge returned empty metadata for session ${session.sessionId}; removing stale entry",
                        )
                        viewModelScope.launch { runCatching { engine.disconnectSession(session.sessionId) } }
                        return@mapNotNull null
                    }

                    val mergedUrl = sessionUrl
                    val mergedManifest = sessionManifest
                    val mergedIcon = sessionIcon
                    SessionSummary(
                        sessionId = session.sessionId,
                        dAppName = session.dAppName.ifBlank { "Unknown dApp" },
                        walletAddress = session.walletAddress,
                        dAppUrl = mergedUrl,
                        manifestUrl = mergedManifest,
                        iconUrl = mergedIcon,
                        createdAt = parseTimestamp(session.createdAtIso),
                        lastActivity = parseTimestamp(session.lastActivityIso),
                    )
                }
                val finalSessions = mapped
                finalSessions.forEach { summary ->
                    Log.d(
                        LOG_TAG,
                        "Mapped session summary: id=${summary.sessionId}, dApp=${summary.dAppName}, " +
                            "url=${summary.dAppUrl}, manifest=${summary.manifestUrl}, icon=${summary.iconUrl}",
                    )
                }
                _state.update { it.copy(sessions = finalSessions, error = null) }
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to load sessions") }
            }
            _state.update { it.copy(isLoadingSessions = false) }
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

    fun importWallet(name: String, network: TonNetwork, words: List<String>, version: String = DEFAULT_WALLET_VERSION) {
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
            val result = runCatching {
                engine.addWalletFromMnemonic(
                    words = cleaned,
                    name = pending.metadata.name,
                    version = version,
                    network = network.asBridgeValue(),
                )
            }
            if (result.isSuccess) {
                val newWalletAccount = result.getOrNull()
                refreshWallets()
                dismissSheet()

                // Automatically switch to the newly imported wallet
                if (newWalletAccount != null) {
                    _state.update { it.copy(activeWalletAddress = newWalletAccount.address) }
                    saveActiveWalletPreference(newWalletAccount.address)
                    Log.d(LOG_TAG, "Auto-switched to newly imported wallet: ${newWalletAccount.address}")
                }

                logEvent("Imported wallet '${pending.metadata.name}' (version: $version)")
            } else {
                pendingWallets.removeLastOrNull()
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: "Failed to import wallet") }
            }
        }
    }

    fun generateWallet(name: String, network: TonNetwork, version: String = DEFAULT_WALLET_VERSION) {
        val words = generateMnemonic()
        val pending = PendingWalletRecord(
            metadata = WalletMetadata(name.ifBlank { defaultWalletName(state.value.wallets.size) }, network, version),
            mnemonic = words,
        )
        viewModelScope.launch {
            switchNetworkIfNeeded(network)
            pendingWallets.addLast(pending)
            val result = runCatching {
                engine.addWalletFromMnemonic(
                    words = words,
                    name = pending.metadata.name,
                    version = version,
                    network = network.asBridgeValue(),
                )
            }
            if (result.isSuccess) {
                val newWalletAccount = result.getOrNull()
                refreshWallets()
                dismissSheet()

                // Automatically switch to the newly generated wallet
                if (newWalletAccount != null) {
                    _state.update { it.copy(activeWalletAddress = newWalletAccount.address) }
                    saveActiveWalletPreference(newWalletAccount.address)
                    Log.d(LOG_TAG, "Auto-switched to newly generated wallet: ${newWalletAccount.address}")
                }

                logEvent("Generated wallet '${pending.metadata.name}' (version: $version)")
            } else {
                pendingWallets.removeLastOrNull()
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: "Failed to generate wallet") }
            }
        }
    }

    fun handleTonConnectUrl(url: String) {
        viewModelScope.launch {
            val trimmed = url.trim()
            val result = runCatching { engine.handleTonConnectUrl(trimmed) }
            result.onSuccess {
                hideUrlPrompt()
                logEvent("Handled TON Connect URL")
            }.onFailure { error ->
                val message = error.message ?: "Ton Connect error"
                val handled = if (message.contains("wallet is required", ignoreCase = true)) {
                    val fallbackNetworks = listOf(TonNetwork.MAINNET, TonNetwork.TESTNET)
                    fallbackNetworks.any { candidate ->
                        if (candidate == currentNetwork) return@any false
                        val retry = runCatching {
                            switchNetworkIfNeeded(candidate)
                            engine.handleTonConnectUrl(trimmed)
                        }
                        if (retry.isSuccess) {
                            hideUrlPrompt()
                            logEvent("Handled TON Connect URL")
                            true
                        } else {
                            false
                        }
                    }
                } else {
                    false
                }

                if (!handled) {
                    _state.update { it.copy(error = message) }
                }
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
                request.iosStyleRequest?.approve()
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
                request.iosStyleRequest?.reject(reason)
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

            val result = runCatching {
                request.iosStyleRequest?.approve()
                    ?: error("Request object not available")
            }

            result.onSuccess { signResult ->
                dismissSheet()

                val signature = signResult.signature

                // Log full details to Android logcat
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "✅ SIGN DATA APPROVED")
                Log.d(LOG_TAG, "========================================")
                Log.d(LOG_TAG, "Request ID: ${request.id}")
                Log.d(LOG_TAG, "Payload Type: ${request.payloadType}")
                Log.d(LOG_TAG, "Signature: $signature")
                Log.d(LOG_TAG, "========================================")

                logEvent("✅ Sign data approved - Signature: ${signature.take(20)}...")

                _state.update {
                    it.copy(
                        status = "✅ Signed! Signature in logs & clipboard",
                        error = null,
                        clipboardContent = signature,
                    )
                }

                // Auto-hide success message after 10 seconds
                launch {
                    delay(10000)
                    _state.update { currentState ->
                        // Only clear if the status is still the success message
                        if (currentState.status == "✅ Signed! Signature in logs & clipboard") {
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
                request.iosStyleRequest?.reject(reason)
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

    // ============================================================
    // Sign Data Demo/Test Methods
    // ============================================================

    /**
     * Triggers a test sign data request with text payload
     */
    fun testSignDataText(walletAddress: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()
                val message = "Welcome to TON!\n\nPlease sign this message to authenticate your wallet.\n\nThis is a demo of the Sign Data feature."

                // Create SignDataPayload as a JSON object then stringify it
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 0) // 0 means text/comment payload
                    put("payload", message)
                }

                // Create the signData RPC request following TON Connect protocol
                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", "demo-dapp")
                    put("walletAddress", walletAddress)
                    put("domain", "demo.ton.org")
                    // params[0] should be a JSON STRING, not an object
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", "WalletKit Demo")
                            put("url", "https://demo.ton.org")
                        },
                    )
                }

                Log.d(LOG_TAG, "Creating test sign data request: $testRequest")

                // Inject through bridge - this will store it and emit the event
                engine.injectSignDataRequest(testRequest)
                logEvent("Test sign data request injected")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create test sign data text request", e)
                _state.update { it.copy(error = "Failed to create sign data request: ${e.message}") }
            }
        }
    }

    /**
     * Triggers a test sign data request with binary payload
     */
    fun testSignDataBinary(walletAddress: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()
                // Create some binary data (base64 encoded)
                val binaryData = android.util.Base64.encodeToString(
                    "Hello, TON! This is binary data with special chars: 🚀💎".toByteArray(Charsets.UTF_8),
                    android.util.Base64.NO_WRAP,
                )

                // Create SignDataPayload for binary data
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 1) // binary type
                    put("payload", binaryData)
                }

                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", "demo-dapp")
                    put("walletAddress", walletAddress)
                    put("domain", "demo.ton.org")
                    // params[0] should be a JSON STRING
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", "WalletKit Demo")
                            put("url", "https://demo.ton.org")
                            put("iconUrl", "https://ton.org/icon.png")
                            put("description", "Testing binary sign data")
                        },
                    )
                }

                Log.d(LOG_TAG, "Created test binary sign data request: $requestId")

                // Inject through bridge - this will store it and emit the event
                engine.injectSignDataRequest(testRequest)
                logEvent("Injected test request into bridge")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create test sign data binary request", e)
                _state.update { it.copy(error = "Failed to create sign data request: ${e.message}") }
            }
        }
    }

    /**
     * Triggers a test sign data request with cell payload
     */
    fun testSignDataCell(walletAddress: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()

                // Create SignDataPayload for cell data
                // This is a simple TON cell containing "Hello, TON!"
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 2) // cell type
                    put("schema", "message#_ text:string = Message;")
                    put("payload", "te6cckEBAQEAEQAAHgAAAABIZWxsbywgVE9OIb7WCx4=") // BOC encoded cell with "Hello, TON!"
                }

                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", "demo-dapp")
                    put("walletAddress", walletAddress)
                    put("domain", "demo.ton.org")
                    // params[0] should be a JSON STRING
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", "WalletKit Demo")
                            put("url", "https://demo.ton.org")
                            put("iconUrl", "https://ton.org/icon.png")
                            put("description", "Testing cell sign data")
                        },
                    )
                }

                Log.d(LOG_TAG, "Created test cell sign data request: $requestId")

                // Inject through bridge - this will store it and emit the event
                engine.injectSignDataRequest(testRequest)
                logEvent("Injected test request into bridge")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create test sign data cell request", e)
                _state.update { it.copy(error = "Failed to create sign data request: ${e.message}") }
            }
        }
    }

    fun testSignDataWithSession(walletAddress: String, sessionId: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()

                // Get session info for display
                val session = _state.value.sessions.find { it.sessionId == sessionId }
                val sessionName = session?.dAppName ?: "Unknown dApp"
                val domain = session?.dAppUrl?.let { url ->
                    // Extract domain from URL
                    url.removePrefix("https://").removePrefix("http://").split("/").firstOrNull() ?: "unknown.domain"
                } ?: "unknown.domain"

                // Create SignDataPayload for text (can be modified for other types)
                val message = "Sign this message via connected dApp session:\n$sessionName"
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 0) // text type
                    put("payload", message)
                }

                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", sessionId) // REAL SESSION ID - will go through bridge!
                    put("walletAddress", walletAddress)
                    put("domain", domain)
                    // params[0] should be a JSON STRING
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", sessionName)
                            put("url", session?.dAppUrl ?: "https://$domain")
                            put("iconUrl", session?.iconUrl ?: "")
                            put("description", "Testing text sign data with connected session")
                        },
                    )
                    // NOTE: No isLocal flag - this will use the bridge!
                }

                Log.d(LOG_TAG, "Created text sign data request with session: $sessionId ($sessionName)")

                // Inject through bridge - signature will be sent back to dApp via bridge
                engine.injectSignDataRequest(testRequest)
                logEvent("Injected connected dApp text sign request: $sessionName")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create sign data request with session", e)
                _state.update { it.copy(error = "Failed to create sign data request: ${e.message}") }
            }
        }
    }

    fun testSignDataBinaryWithSession(walletAddress: String, sessionId: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()

                // Get session info for display
                val session = _state.value.sessions.find { it.sessionId == sessionId }
                val sessionName = session?.dAppName ?: "Unknown dApp"
                val domain = session?.dAppUrl?.let { url ->
                    // Extract domain from URL
                    url.removePrefix("https://").removePrefix("http://").split("/").firstOrNull() ?: "unknown.domain"
                } ?: "unknown.domain"

                // Create SignDataPayload for binary data
                // Example: "Binary data from wallet" as base64
                val binaryData = "QmluYXJ5IGRhdGEgZnJvbSB3YWxsZXQ=" // base64 encoded
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 1) // binary type
                    put("payload", binaryData)
                }

                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", sessionId) // REAL SESSION ID - will go through bridge!
                    put("walletAddress", walletAddress)
                    put("domain", domain)
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", sessionName)
                            put("url", session?.dAppUrl ?: "https://$domain")
                            put("iconUrl", session?.iconUrl ?: "")
                            put("description", "Testing binary sign data with connected session")
                        },
                    )
                }

                Log.d(LOG_TAG, "Created binary sign data request with session: $sessionId ($sessionName)")

                engine.injectSignDataRequest(testRequest)
                logEvent("Injected connected dApp binary sign request: $sessionName")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create binary sign data request with session", e)
                _state.update { it.copy(error = "Failed to create binary sign data request: ${e.message}") }
            }
        }
    }

    fun testSignDataCellWithSession(walletAddress: String, sessionId: String) {
        viewModelScope.launch {
            try {
                val requestId = java.util.UUID.randomUUID().toString()

                // Get session info for display
                val session = _state.value.sessions.find { it.sessionId == sessionId }
                val sessionName = session?.dAppName ?: "Unknown dApp"
                val domain = session?.dAppUrl?.let { url ->
                    // Extract domain from URL
                    url.removePrefix("https://").removePrefix("http://").split("/").firstOrNull() ?: "unknown.domain"
                } ?: "unknown.domain"

                // Create SignDataPayload for cell data
                val signDataPayload = JSONObject().apply {
                    put("schema_crc", 2) // cell type
                    put("schema", "message#_ text:string = Message;")
                    put("payload", "te6cckEBAQEAEQAAHgAAAABIZWxsbywgVE9OIb7WCx4=") // BOC encoded cell with "Hello, TON!"
                }

                val testRequest = JSONObject().apply {
                    put("id", requestId)
                    put("method", "signData")
                    put("from", sessionId) // REAL SESSION ID - will go through bridge!
                    put("walletAddress", walletAddress)
                    put("domain", domain)
                    put(
                        "params",
                        JSONArray().apply {
                            put(signDataPayload.toString())
                        },
                    )
                    put(
                        "dAppInfo",
                        JSONObject().apply {
                            put("name", sessionName)
                            put("url", session?.dAppUrl ?: "https://$domain")
                            put("iconUrl", session?.iconUrl ?: "")
                            put("description", "Testing cell sign data with connected session")
                        },
                    )
                }

                Log.d(LOG_TAG, "Created cell sign data request with session: $sessionId ($sessionName)")

                engine.injectSignDataRequest(testRequest)
                logEvent("Injected connected dApp cell sign request: $sessionName")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create cell sign data request with session", e)
                _state.update { it.copy(error = "Failed to create sign data request: ${e.message}") }
            }
        }
    }

    fun disconnectSession(sessionId: String) {
        viewModelScope.launch {
            val result = runCatching { engine.disconnectSession(sessionId) }
            result.onSuccess {
                refreshSessions()
                logEvent("Disconnected session $sessionId")
                // Session data is managed internally by the bridge
            }.onFailure { error ->
                _state.update { it.copy(error = error.message ?: "Failed to disconnect session") }
            }
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
                val normalizedRecipient = recipient.trim()
                if (normalizedRecipient.isEmpty()) {
                    throw IllegalArgumentException("Recipient address is required")
                }

                val amountDecimal =
                    amount.trim()
                        .takeIf { it.isNotEmpty() }
                        ?.toBigDecimalOrNull()
                        ?: throw IllegalArgumentException("Invalid amount")

                if (amountDecimal <= BigDecimal.ZERO) {
                    throw IllegalArgumentException("Amount must be greater than zero")
                }

                val nanoTonAmount =
                    amountDecimal
                        .movePointRight(9)
                        .setScale(0, RoundingMode.HALF_UP)
                        .toPlainString()

                val normalizedComment = comment.trim()

                // Note: This triggers handleNewTransaction which fires a transactionRequest event
                // The event will be caught in onBridgeEvent() and shown in a TransactionRequestSheet
                // where the user can see fees and approve/reject
                val response = if (normalizedComment.isNotEmpty()) {
                    logEvent("Creating transaction with comment: ${normalizedComment.take(20)}${if (normalizedComment.length > 20) "..." else ""}")
                    engine.sendTransaction(walletAddress, normalizedRecipient, nanoTonAmount, normalizedComment)
                } else {
                    engine.sendTransaction(walletAddress, normalizedRecipient, nanoTonAmount)
                }
                logEvent("Created transaction request for $amount TON to ${normalizedRecipient.take(8)}…")
                response
            }

            result.onSuccess {
                // Don't dismiss sheet yet - wait for transactionRequest event
                // The sheet will be replaced by TransactionRequestSheet
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

            // Refresh wallet state to get latest balance and transactions
            refreshWallets()
            logEvent("Switched to wallet: ${wallet.name}")
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

            // Fetch fresh transactions from network
            val result = runCatching { engine.getRecentTransactions(targetAddress, limit) }
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

    private fun parseTransactionDetail(tx: io.ton.walletkit.presentation.model.Transaction, walletAddress: String): TransactionDetailUi {
        val isOutgoing = tx.type == io.ton.walletkit.presentation.model.TransactionType.OUTGOING

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
            val wallet = state.value.wallets.firstOrNull { it.address == address }
            if (wallet == null) {
                _state.update { it.copy(error = "Wallet not found") }
                return@launch
            }

            val removeResult = runCatching { engine.removeWallet(address) }
            if (removeResult.isFailure) {
                val reason = removeResult.exceptionOrNull()?.message ?: "Failed to remove wallet"
                _state.update { it.copy(error = reason) }
                return@launch
            }

            runCatching { storage.clear(address) }.onFailure {
                Log.w(LOG_TAG, "removeWallet: failed to clear storage for $address", it)
            }

            // Clear transaction cache for removed wallet
            transactionCache.clear(address)

            // Note: Sessions are managed internally by the bridge.
            // When a wallet is removed from the bridge, associated sessions are automatically cleaned up.

            walletMetadata.remove(address)

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

            logEvent("Removed wallet: ${wallet.name}")
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
                    network = updated.network.asBridgeValue(),
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
        val accounts = engine.getWallets()
        Log.d(LOG_TAG, "loadWalletSummaries: got ${accounts.size} accounts")
        val knownAddresses = accounts.map { it.address }.toSet()
        walletMetadata.keys.retainAll(knownAddresses)

        val result = mutableListOf<WalletSummary>()
        for (account in accounts) {
            val metadata = ensureMetadata(account)

            Log.d(LOG_TAG, "loadWalletSummaries: fetching state for ${account.address}")
            val state = runCatching {
                engine.getWalletState(account.address)
            }.onFailure {
                Log.e(LOG_TAG, "loadWalletSummaries: getWalletState failed for ${account.address}", it)
            }.getOrNull()
            val balance = state?.balance
            Log.d(LOG_TAG, "loadWalletSummaries: balance for ${account.address} = $balance")
            val formatted = balance?.let(::formatTon)

            // Try to get transactions from cache first
            val cachedTransactions = transactionCache.get(account.address)

            // Fetch fresh transactions from network
            val transactions = runCatching {
                engine.getRecentTransactions(account.address, TRANSACTION_FETCH_LIMIT)
            }.onFailure {
                Log.w(LOG_TAG, "loadWalletSummaries: getRecentTransactions failed for ${account.address}", it)
            }.getOrNull()

            // Update cache and use merged result
            val finalTransactions = if (transactions != null) {
                transactionCache.update(account.address, transactions)
            } else {
                // If fetch failed, use cached transactions or state transactions as fallback
                cachedTransactions ?: state?.transactions
            }

            // Get sessions connected to this wallet
            val walletSessions = _state.value.sessions.filter { session ->
                session.walletAddress == account.address
            }

            val summary = WalletSummary(
                address = account.address,
                name = metadata.name,
                network = metadata.network,
                version = metadata.version.ifBlank { account.version },
                publicKey = account.publicKey,
                balanceNano = balance,
                balance = formatted,
                transactions = finalTransactions,
                lastUpdated = System.currentTimeMillis(),
                connectedSessions = walletSessions,
            )
            result.add(summary)
        }
        return result
    }

    private suspend fun ensureMetadata(account: WalletAccount): WalletMetadata {
        walletMetadata[account.address]?.let { return it }

        val pending = pendingWallets.removeLastOrNull()
        val storedRecord = storage.loadWallet(account.address)
        val metadata = pending?.metadata
            ?: storedRecord?.let {
                WalletMetadata(
                    name = it.name,
                    network = TonNetwork.fromBridge(it.network, currentNetwork),
                    version = it.version,
                )
            }
            ?: WalletMetadata(
                name = defaultWalletName(account.index),
                network = TonNetwork.fromBridge(account.network, currentNetwork),
                version = account.version.ifBlank { DEFAULT_WALLET_VERSION },
            )
        walletMetadata[account.address] = metadata

        if (pending?.mnemonic != null) {
            val record = WalletRecord(
                mnemonic = pending.mnemonic,
                name = metadata.name,
                network = metadata.network.asBridgeValue(),
                version = metadata.version,
            )
            runCatching { storage.saveWallet(account.address, record) }
        } else if (storedRecord != null) {
            val needsUpdate = storedRecord.name != metadata.name ||
                storedRecord.network != metadata.network.asBridgeValue() ||
                storedRecord.version != metadata.version
            if (needsUpdate) {
                val record = WalletRecord(
                    mnemonic = storedRecord.mnemonic,
                    name = metadata.name,
                    network = metadata.network.asBridgeValue(),
                    version = metadata.version,
                )
                runCatching { storage.saveWallet(account.address, record) }
            }
        }

        return metadata
    }

    private suspend fun ensureWallet() {
        val existing = runCatching { engine.getWallets() }.getOrDefault(emptyList())
        if (existing.isNotEmpty()) {
            existing.forEach { ensureMetadata(it) }
            return
        }

        val metadata = WalletMetadata(
            name = DEMO_WALLET_NAME,
            network = currentNetwork,
            version = DEFAULT_WALLET_VERSION,
        )
        val pendingRecord = PendingWalletRecord(metadata = metadata, mnemonic = DEMO_MNEMONIC)
        pendingWallets.addLast(pendingRecord)
        runCatching {
            engine.addWalletFromMnemonic(
                words = DEMO_MNEMONIC,
                name = DEMO_WALLET_NAME,
                version = DEFAULT_WALLET_VERSION,
                network = currentNetwork.asBridgeValue(),
            )
        }.onFailure { error ->
            pendingWallets.remove(pendingRecord)
            _state.update { it.copy(error = error.message ?: "Failed to prepare demo wallet") }
        }
    }

    private suspend fun reinitializeForNetwork(
        target: TonNetwork,
    ) {
        val endpoints = networkEndpoints(target)
        engine.init(
            WalletKitBridgeConfig(
                network = target.asBridgeValue(),
                tonClientEndpoint = endpoints.tonClientEndpoint,
                tonApiUrl = endpoints.tonApiUrl,
                bridgeUrl = endpoints.bridgeUrl,
                bridgeName = endpoints.bridgeName,
                // Storage is always persistent - managed internally by bridge
            ),
        )

        currentNetwork = target
        walletMetadata.clear()
        pendingWallets.clear()

        // Wallets are automatically restored by bridge - no manual restoration needed
        // Just ensure we have at least one wallet for demo purposes
        ensureWallet()
    }

    private suspend fun switchNetworkIfNeeded(target: TonNetwork) {
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
    private fun onBridgeEvent(event: WalletKitEvent) {
        when (event) {
            is WalletKitEvent.ConnectRequestEvent -> {
                // Request object contains all data plus approve/reject methods
                val request = event.request
                val dAppInfo = request.dAppInfo

                // Convert to UI model for existing sheets
                val uiRequest = ConnectRequestUi(
                    id = request.requestId.toString(),
                    dAppName = dAppInfo?.name ?: "Unknown dApp",
                    dAppUrl = dAppInfo?.url ?: "",
                    manifestUrl = dAppInfo?.manifestUrl ?: "",
                    iconUrl = dAppInfo?.iconUrl,
                    permissions = request.permissions.map { permission ->
                        ConnectPermissionUi(
                            name = permission.name ?: "unknown",
                            title = permission.title ?: permission.name?.replaceFirstChar { it.uppercase() } ?: "Unknown",
                            description = permission.description ?: "Allow access to ${permission.name}",
                        )
                    },
                    requestedItems = request.permissions.mapNotNull { it.name },
                    raw = org.json.JSONObject(), // Not needed with this API
                    connectRequest = request, // Store for direct approve/reject
                )

                setSheet(SheetState.Connect(uiRequest))
                logEvent("Connect request from ${dAppInfo?.name ?: "Unknown dApp"}")
            }

            is WalletKitEvent.TransactionRequestEvent -> {
                // Request object contains all data plus approve/reject methods
                val request = event.request
                val dAppInfo = request.dAppInfo
                val txRequest = request.request

                // Extract wallet address from the raw event data if available
                // Otherwise use the active wallet address
                val walletAddress = state.value.activeWalletAddress ?: ""

                // Convert to UI model
                val messages = listOf(
                    TransactionMessageUi(
                        to = txRequest.recipient,
                        amount = txRequest.amount,
                        comment = txRequest.comment,
                        payload = txRequest.payload,
                        stateInit = null,
                    ),
                )

                val uiRequest = TransactionRequestUi(
                    id = request.requestId.toString(),
                    walletAddress = walletAddress,
                    dAppName = dAppInfo?.name ?: "Unknown dApp",
                    validUntil = null,
                    messages = messages,
                    preview = request.preview, // Pass preview data from bridge
                    raw = org.json.JSONObject(),
                    iosStyleRequest = request, // Store for direct approve/reject
                )

                setSheet(SheetState.Transaction(uiRequest))
                logEvent("Transaction request ${request.requestId}")
            }

            is WalletKitEvent.SignDataRequestEvent -> {
                // Request object contains all data plus approve/reject methods
                val request = event.request
                val dAppInfo = request.dAppInfo

                // Use typed event data instead of legacy parsed data
                val typedEvent = request.event
                val eventPayload = typedEvent.request
                val eventPreview = typedEvent.preview

                // Extract payload content based on type
                val payloadType = eventPayload?.type?.name?.lowercase() ?: "unknown"
                val payloadContent = when (eventPayload?.type) {
                    io.ton.walletkit.presentation.event.SignDataType.TEXT -> {
                        eventPayload.text ?: ""
                    }
                    io.ton.walletkit.presentation.event.SignDataType.BINARY -> {
                        eventPayload.bytes ?: ""
                    }
                    io.ton.walletkit.presentation.event.SignDataType.CELL -> {
                        eventPayload.cell ?: ""
                    }
                    else -> ""
                }

                // Generate preview based on type and use event preview if available
                val preview = eventPreview?.content ?: when (eventPayload?.type) {
                    io.ton.walletkit.presentation.event.SignDataType.TEXT -> {
                        // For text payloads, show the text directly (decode if base64)
                        val text = eventPayload.text ?: ""
                        text.take(200).let {
                            if (text.length > 200) "$it..." else it
                        }
                    }
                    io.ton.walletkit.presentation.event.SignDataType.BINARY -> {
                        // For binary payloads, show base64 preview
                        val bytes = eventPayload.bytes ?: ""
                        "Binary data (${bytes.length} chars)\n${bytes.take(100)}..."
                    }
                    io.ton.walletkit.presentation.event.SignDataType.CELL -> {
                        // For cell payloads, show BOC preview
                        val cell = eventPayload.cell ?: ""
                        "Cell BOC (${cell.length} chars)\n${cell.take(100)}..."
                    }
                    else -> {
                        // Unknown type - show what we have
                        payloadContent.take(100).let {
                            if (payloadContent.length > 100) "$it..." else it
                        }
                    }
                }

                val uiRequest = SignDataRequestUi(
                    id = request.requestId.toString(),
                    walletAddress = typedEvent.walletAddress ?: typedEvent.from ?: "",
                    payloadType = payloadType,
                    payloadContent = payloadContent,
                    preview = preview,
                    raw = org.json.JSONObject(),
                    iosStyleRequest = request, // Store for direct approve/reject
                )

                setSheet(SheetState.SignData(uiRequest))
                logEvent("Sign data request ${request.requestId}: type=$payloadType")
            }

            is WalletKitEvent.DisconnectEvent -> {
                Log.d(LOG_TAG, "Received disconnect event: sessionId=${event.sessionId}")
                viewModelScope.launch {
                    // Session data is managed internally by the bridge
                    runCatching { engine.disconnectSession(event.sessionId) }
                    refreshSessions()
                    logEvent("Session disconnected")
                }
            }

            is WalletKitEvent.StateChangedEvent -> {
                Log.d(LOG_TAG, "Wallet state changed: ${event.address}")
                refreshWallets()
            }

            is WalletKitEvent.SessionsChangedEvent -> {
                Log.d(LOG_TAG, "Sessions changed")
                refreshSessions()
            }
        }
    }

    private fun logEvent(message: String) {
        _state.update {
            val events = listOf(message) + it.events
            it.copy(events = events.take(MAX_EVENT_LOG))
        }
    }

    private fun networkEndpoints(network: TonNetwork): NetworkEndpoints = when (network) {
        TonNetwork.MAINNET -> NetworkEndpoints(
            tonClientEndpoint = "https://toncenter.com/api/v2/jsonRPC",
            tonApiUrl = "https://tonapi.io",
            bridgeUrl = DEFAULT_BRIDGE_URL,
            bridgeName = DEFAULT_BRIDGE_NAME,
        )
        TonNetwork.TESTNET -> NetworkEndpoints(
            tonClientEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC",
            tonApiUrl = "https://testnet.tonapi.io",
            bridgeUrl = DEFAULT_BRIDGE_URL,
            bridgeName = DEFAULT_BRIDGE_NAME,
        )
    }

    override fun onCleared() {
        balanceJob?.cancel()
        bridgeListener?.close()
        viewModelScope.launch {
            runCatching { engine.destroy() }
        }
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
        private val DEFAULT_NETWORK = TonNetwork.MAINNET
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
            engine: WalletKitEngine,
            storage: DemoAppStorage,
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                require(modelClass.isAssignableFrom(WalletKitViewModel::class.java))
                return WalletKitViewModel(engine, storage) as T
            }
        }
    }
}
