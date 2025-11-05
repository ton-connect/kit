package io.ton.walletkit.demo.presentation.viewmodel

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import io.ton.walletkit.ITONWallet
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.WalletRecord
import io.ton.walletkit.demo.domain.model.PendingWalletRecord
import io.ton.walletkit.demo.domain.model.WalletInterfaceType
import io.ton.walletkit.demo.domain.model.WalletMetadata
import io.ton.walletkit.demo.domain.model.toBridgeValue
import io.ton.walletkit.demo.presentation.model.ConnectPermissionUi
import io.ton.walletkit.demo.presentation.model.ConnectRequestUi
import io.ton.walletkit.demo.presentation.model.JettonDetails
import io.ton.walletkit.demo.presentation.model.JettonSummary
import io.ton.walletkit.demo.presentation.model.SignDataRequestUi
import io.ton.walletkit.demo.presentation.model.TransactionMessageUi
import io.ton.walletkit.demo.presentation.model.TransactionRequestUi
import io.ton.walletkit.demo.presentation.model.WalletSummary
import io.ton.walletkit.demo.presentation.state.SheetState
import io.ton.walletkit.demo.presentation.state.WalletUiState
import io.ton.walletkit.demo.presentation.util.TransactionDetailMapper
import io.ton.walletkit.event.TONWalletKitEvent
import io.ton.walletkit.extensions.disconnect
import io.ton.walletkit.model.TONNetwork
import io.ton.walletkit.model.TONWalletData
import io.ton.walletkit.model.WalletSigner
import io.ton.walletkit.request.TONWalletConnectionRequest
import io.ton.walletkit.request.TONWalletSignDataRequest
import io.ton.walletkit.request.TONWalletTransactionRequest
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
import javax.inject.Inject
import kotlin.collections.ArrayDeque
import kotlin.collections.firstOrNull

@HiltViewModel
class WalletKitViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val storage: DemoAppStorage,
    private val sdkEvents: @JvmSuppressWildcards SharedFlow<TONWalletKitEvent>,
    private val sdkInitialized: @JvmSuppressWildcards SharedFlow<Boolean>,
) : ViewModel() {

    private val application: Application get() = context.applicationContext as Application

    private val _state = MutableStateFlow(
        WalletUiState(
            status = application.getString(R.string.wallet_status_loading),
        ),
    )
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    private var balanceJob: Job? = null
    private var walletKit: io.ton.walletkit.ITONWalletKit? = null

    private val lifecycleManager = WalletLifecycleManager(
        storage = storage,
        defaultWalletVersion = DEFAULT_WALLET_VERSION,
        defaultWalletNameProvider = { index -> defaultWalletName(index) },
        kitProvider = { getKit() },
        initialNetwork = DEFAULT_NETWORK,
    )

    private val sessionsViewModel = SessionsViewModel(
        getAllWallets = { lifecycleManager.tonWallets.values.toList() },
        getKit = { walletKit ?: error("ITONWalletKit not initialized") },
        unknownDAppLabel = uiString(R.string.wallet_event_unknown_dapp),
    )

    private val uiCoordinator = WalletUiStateCoordinator(_state)
    private val securityController = WalletSecurityController(storage)
    private val eventLogger = WalletEventLogger(
        state = _state,
        scope = viewModelScope,
        maxEvents = MAX_EVENT_LOG,
        hideDelayMillis = HIDE_MESSAGE_MS,
        defaultStatusProvider = { uiString(R.string.wallet_status_walletkit_ready) },
        stringProvider = { resId, args -> uiString(resId, *args) },
    )

    val isPasswordSet: StateFlow<Boolean> = securityController.isPasswordSet
    val isUnlocked: StateFlow<Boolean> = securityController.isUnlocked

    private val tonConnectViewModel = TonConnectViewModel(
        getWalletByAddress = { address -> lifecycleManager.tonWallets[address] },
        onRequestApproved = { onTonConnectRequestApproved() },
        onRequestRejected = { onTonConnectRequestRejected() },
        onSessionsChanged = { viewModelScope.launch { sessionsViewModel.refresh() } },
    )

    private val walletOperationsViewModel = WalletOperationsViewModel(
        walletKit = { walletKit ?: error("ITONWalletKit not initialized") },
        getWalletByAddress = { address -> lifecycleManager.tonWallets[address] },
        onWalletSwitched = { address -> handleWalletSwitched(address) },
        onTransactionInitiated = { address -> onLocalTransactionInitiated(address) },
    )

    // NFTs ViewModel for active wallet
    private val _nftsViewModel = MutableStateFlow<NFTsListViewModel?>(null)
    val nftsViewModel: StateFlow<NFTsListViewModel?> = _nftsViewModel.asStateFlow()

    private val activeTransactionHistoryViewModel = MutableStateFlow<TransactionHistoryViewModel?>(null)
    private val activeJettonsViewModel = MutableStateFlow<JettonsListViewModel?>(null)

    private var jettonsCollectors: List<Job> = emptyList()
    private var transactionsCollectors: List<Job> = emptyList()
    private var currentTransactionsWalletAddress: String? = null
    private var currentJettonsWalletAddress: String? = null
    private var currentNftsWalletAddress: String? = null

    private sealed interface TonConnectAction {
        data class Connect(val request: ConnectRequestUi, val wallet: WalletSummary?) : TonConnectAction
        data class Transaction(val request: TransactionRequestUi) : TonConnectAction
        data class SignData(val request: SignDataRequestUi, val viaSigner: Boolean) : TonConnectAction
    }

    private var pendingTonConnectAction: TonConnectAction? = null

    private fun uiString(@StringRes resId: Int, vararg args: Any): String = application.getString(resId, *args)

    /**
     * Get the shared ITONWalletKit instance used across the demo.
     */
    private suspend fun getKit(): io.ton.walletkit.ITONWalletKit {
        walletKit?.let { return it }
        val kit = io.ton.walletkit.demo.core.TONWalletKitHelper.mainnet(application)
        walletKit = kit
        return kit
    }

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

        observeSessions()
        observeWalletOperations()
        observeTonConnect()
    }

    private suspend fun bootstrap() {
        _state.update { it.copy(status = uiString(R.string.wallet_status_loading), error = null) }

        val bootstrapResult = lifecycleManager.bootstrap()
        if (bootstrapResult.isFailure) {
            val loadErrorMessage = bootstrapResult.exceptionOrNull()?.message ?: uiString(R.string.wallet_error_load_default)
            _state.update {
                it.copy(
                    status = uiString(R.string.wallet_status_failed_to_load),
                    error = loadErrorMessage,
                )
            }
            return
        }

        _state.update { it.copy(initialized = true, status = uiString(R.string.wallet_status_ready), error = null) }

        val savedActiveWallet = bootstrapResult.getOrNull()?.savedActiveWallet
        Log.d(LOG_TAG, "Loaded saved active wallet: $savedActiveWallet")

        // Load wallets and sessions concurrently and wait for both to complete
        coroutineScope {
            val walletsJob = async { refreshWallets() }
            val sessionsJob = async { sessionsViewModel.loadSessions() }
            walletsJob.await()
            sessionsJob.await()
        }

        // Restore saved active wallet after wallets are loaded
        // Only restore if the saved wallet actually exists in the loaded wallets
        val tonWallets = lifecycleManager.tonWallets
        if (!savedActiveWallet.isNullOrBlank() && tonWallets.containsKey(savedActiveWallet)) {
            Log.d(LOG_TAG, "Restored active wallet selection: $savedActiveWallet")
            applyWalletSwitch(
                address = savedActiveWallet,
                persistPreference = false,
                logSwitch = false,
                refreshOnSwitch = false,
            )
        } else {
            if (!savedActiveWallet.isNullOrBlank()) {
                Log.w(LOG_TAG, "Saved active wallet '$savedActiveWallet' not found in loaded wallets, using first wallet instead")
            }
            state.value.activeWalletAddress?.let { address ->
                if (tonWallets.containsKey(address)) {
                    applyWalletSwitch(
                        address = address,
                        persistPreference = false,
                        logSwitch = false,
                        refreshOnSwitch = false,
                    )
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
                viewModelScope.launch { sessionsViewModel.refresh() }
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

    private fun observeSessions() {
        viewModelScope.launch {
            sessionsViewModel.state.collect { sessionsState ->
                uiCoordinator.onSessionsStateChanged(sessionsState)
            }
        }
    }

    private fun observeWalletOperations() {
        viewModelScope.launch {
            walletOperationsViewModel.state.collect { operationsState ->
                uiCoordinator.onWalletOperationsStateChanged(operationsState)
                if (operationsState.successMessage != null) {
                    walletOperationsViewModel.clearMessage()
                }
                if (operationsState.error != null) {
                    walletOperationsViewModel.clearMessage()
                }
            }
        }
    }

    private fun observeTonConnect() {
        viewModelScope.launch {
            tonConnectViewModel.state.collect { tonState ->
                uiCoordinator.onTonConnectStateChanged(tonState)
                if (tonState.successMessage != null) {
                    uiCoordinator.hideUrlPrompt()
                }
                if (tonState.error != null) {
                    pendingTonConnectAction = null
                }
                if (tonState.error != null || tonState.successMessage != null) {
                    tonConnectViewModel.clearMessage()
                }
            }
        }
    }

    private fun handleWalletSwitched(
        address: String,
        persistPreference: Boolean = true,
        logSwitch: Boolean = true,
        refreshOnSwitch: Boolean = true,
    ) {
        viewModelScope.launch {
            applyWalletSwitch(
                address = address,
                persistPreference = persistPreference,
                logSwitch = logSwitch,
                refreshOnSwitch = refreshOnSwitch,
            )
        }
    }

    private suspend fun applyWalletSwitch(
        address: String,
        persistPreference: Boolean,
        logSwitch: Boolean,
        refreshOnSwitch: Boolean,
    ) {
        val wallet = lifecycleManager.tonWallets[address]
        if (wallet == null) {
            _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
            return
        }

        uiCoordinator.setActiveWallet(address)

        if (persistPreference) {
            lifecycleManager.persistActiveWalletPreference(address)
        }

        updateNftsViewModel(address)
        attachTransactionHistoryViewModel(address)
        attachJettonsViewModel(address)

        if (refreshOnSwitch) {
            refreshWallets()
        }

        if (logSwitch) {
            val walletName = lifecycleManager.walletMetadata[address]?.name ?: wallet.address ?: address
            eventLogger.log(R.string.wallet_event_switched_wallet, walletName)
        }
    }

    private fun onLocalTransactionInitiated(walletAddress: String) {
        val walletName = state.value.wallets.firstOrNull { it.address == walletAddress }?.name ?: walletAddress
        eventLogger.log(R.string.wallet_event_transaction_initiated, walletName)
    }

    private fun onTonConnectRequestApproved() {
        when (val action = pendingTonConnectAction) {
            is TonConnectAction.Connect -> {
                eventLogger.log(R.string.wallet_event_approved_connect, action.request.dAppName)
                dismissOrRestoreBrowserSheet()
            }
            is TonConnectAction.Transaction -> {
                eventLogger.log(R.string.wallet_event_approved_transaction, action.request.id)
                viewModelScope.launch {
                    refreshWallets()
                    sessionsViewModel.refresh()
                }
                dismissSheet()
            }
            is TonConnectAction.SignData -> {
                val eventRes = if (action.viaSigner) {
                    R.string.wallet_event_sign_data_approved_signer
                } else {
                    R.string.wallet_event_sign_data_approved
                }
                eventLogger.log(eventRes)
                dismissSheet()
                eventLogger.showTemporaryStatus(uiString(R.string.wallet_status_signed_success))
                if (action.viaSigner) {
                    viewModelScope.launch {
                        if (state.value.activeWalletAddress == action.request.walletAddress) {
                            activeTransactionHistoryViewModel.value?.refresh()
                        }
                    }
                }
            }
            null -> Unit
        }
        pendingTonConnectAction = null
    }

    private fun onTonConnectRequestRejected() {
        when (val action = pendingTonConnectAction) {
            is TonConnectAction.Connect -> {
                eventLogger.log(R.string.wallet_event_rejected_connect, action.request.dAppName)
                dismissOrRestoreBrowserSheet()
            }
            is TonConnectAction.Transaction -> {
                eventLogger.log(R.string.wallet_event_rejected_transaction, action.request.id)
                dismissSheet()
            }
            is TonConnectAction.SignData -> {
                if (action.viaSigner) {
                    eventLogger.log(R.string.wallet_event_sign_request_cancelled)
                    dismissSheet()
                    eventLogger.showTemporaryStatus(uiString(R.string.wallet_status_sign_cancelled))
                } else {
                    eventLogger.log(R.string.wallet_event_sign_request_rejected)
                    dismissSheet()
                    eventLogger.showTemporaryStatus(uiString(R.string.wallet_status_sign_rejected))
                }
            }
            null -> Unit
        }
        pendingTonConnectAction = null
    }

    private fun dismissOrRestoreBrowserSheet() {
        val previousSheet = _state.value.previousSheet
        if (previousSheet is SheetState.Browser) {
            uiCoordinator.setSheet(previousSheet, savePrevious = false)
        } else {
            dismissSheet()
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
            sessionsViewModel.refresh()
        }
    }

    suspend fun refreshWallets() {
        _state.update { it.copy(isLoadingWallets = true) }
        Log.d(
            LOG_TAG,
            "refreshWallets: start active=${state.value.activeWalletAddress} cached=${lifecycleManager.tonWallets.keys}",
        )
        val summaries = runCatching { lifecycleManager.loadWalletSummaries(state.value.sessions) }
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

            if (activeAddress != newActiveAddress || lifecycleManager.lastPersistedActiveWallet != newActiveAddress) {
                lifecycleManager.persistActiveWalletPreference(newActiveAddress)
            }

            if (currentTransactionsWalletAddress != newActiveAddress) {
                attachTransactionHistoryViewModel(newActiveAddress)
            }
            if (currentJettonsWalletAddress != newActiveAddress) {
                attachJettonsViewModel(newActiveAddress)
            }
            updateNftsViewModel(newActiveAddress)
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
        sessionsViewModel.loadSessions()
    }

    fun openAddWalletSheet() {
        uiCoordinator.openAddWalletSheet()
    }

    fun showWalletDetails(address: String) {
        val target = state.value.wallets.firstOrNull { it.address == address }
        if (target != null) {
            uiCoordinator.showWalletDetails(target)
        }
    }

    fun dismissSheet() {
        uiCoordinator.dismissSheet()
    }

    fun showUrlPrompt() {
        uiCoordinator.showUrlPrompt()
    }

    fun hideUrlPrompt() {
        uiCoordinator.hideUrlPrompt()
    }

    fun openBrowser(url: String) {
        uiCoordinator.openBrowser(url)
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
            lifecycleManager.switchNetworkIfNeeded(network) {
                refreshWallets()
                sessionsViewModel.refresh()
            }
            lifecycleManager.pendingWallets.addLast(pending)

            val result = runCatching {
                val kit = getKit()
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(cleaned, name)
                    kit.addWalletWithSigner(
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

                var newAddress: String? = null
                newWallet?.address?.let { address ->
                    newAddress = address
                    lifecycleManager.tonWallets[address] = newWallet

                    // Store metadata and mnemonic for UI
                    lifecycleManager.walletMetadata[address] = pending.metadata
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

                newAddress?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    lifecycleManager.persistActiveWalletPreference(address)
                    updateNftsViewModel(address)
                    loadJettons()
                    Log.d(LOG_TAG, "Auto-switched to newly imported wallet: $address")
                }
                refreshWallets()
                dismissSheet()

                eventLogger.log(
                    R.string.wallet_event_wallet_imported,
                    pending.metadata.name,
                    version,
                    interfaceType.value,
                )
            } else {
                lifecycleManager.pendingWallets.removeLastOrNull()
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
                kit.createMnemonic(24)
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
            lifecycleManager.switchNetworkIfNeeded(network) {
                refreshWallets()
                sessionsViewModel.refresh()
            }
            lifecycleManager.pendingWallets.addLast(pending)

            val result = runCatching {
                val kit = getKit()
                if (interfaceType == WalletInterfaceType.SIGNER) {
                    // Create wallet with external signer that requires user confirmation
                    val signer = createDemoSigner(words, name)
                    kit.addWalletWithSigner(
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

                var newAddress: String? = null
                newWallet?.address?.let { address ->
                    newAddress = address
                    lifecycleManager.tonWallets[address] = newWallet

                    lifecycleManager.walletMetadata[address] = pending.metadata
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

                newAddress?.let { address ->
                    _state.update { it.copy(activeWalletAddress = address) }
                    lifecycleManager.persistActiveWalletPreference(address)
                    updateNftsViewModel(address)
                    loadJettons()
                    Log.d(LOG_TAG, "Auto-switched to newly generated wallet: $address")
                }
                refreshWallets()
                dismissSheet()

                eventLogger.log(
                    R.string.wallet_event_wallet_generated,
                    pending.metadata.name,
                    version,
                    interfaceType.value,
                )
            } else {
                lifecycleManager.pendingWallets.removeLastOrNull()
                val fallback = uiString(R.string.wallet_error_generate_failed)
                _state.update { it.copy(error = result.exceptionOrNull()?.message ?: fallback) }
            }
        }
    }

    fun handleTonConnectUrl(url: String) {
        val activeAddress = state.value.activeWalletAddress
        if (activeAddress == null) {
            _state.update { it.copy(error = uiString(R.string.wallet_error_no_wallet_selected)) }
            return
        }
        tonConnectViewModel.handleTonConnectUrl(url.trim(), activeAddress)
    }

    fun approveConnect(request: ConnectRequestUi, wallet: WalletSummary) {
        pendingTonConnectAction = TonConnectAction.Connect(request, wallet)
        tonConnectViewModel.approveConnect(request, wallet.address)
    }

    fun rejectConnect(request: ConnectRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        pendingTonConnectAction = TonConnectAction.Connect(request, null)
        tonConnectViewModel.rejectConnect(request, reason)
    }

    fun approveTransaction(request: TransactionRequestUi) {
        pendingTonConnectAction = TonConnectAction.Transaction(request)
        tonConnectViewModel.approveTransaction(request)
    }

    fun rejectTransaction(request: TransactionRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        pendingTonConnectAction = TonConnectAction.Transaction(request)
        tonConnectViewModel.rejectTransaction(request, reason)
    }

    fun approveSignData(request: SignDataRequestUi) {
        val wallet = state.value.wallets.firstOrNull { it.address == request.walletAddress }
        if (wallet?.interfaceType == WalletInterfaceType.SIGNER) {
            Log.d(LOG_TAG, "Wallet is SIGNER type, requesting confirmation for sign data")
            _state.update { it.copy(pendingSignerConfirmation = request) }
            return
        }
        pendingTonConnectAction = TonConnectAction.SignData(request, viaSigner = false)
        tonConnectViewModel.approveSignData(request)
    }

    fun rejectSignData(request: SignDataRequestUi, reason: String = DEFAULT_REJECTION_REASON) {
        pendingTonConnectAction = TonConnectAction.SignData(request, viaSigner = false)
        tonConnectViewModel.rejectSignData(request, reason)
    }

    fun confirmSignerApproval() {
        val request = state.value.pendingSignerConfirmation
        if (request == null) {
            Log.w(LOG_TAG, "No pending signer confirmation to approve")
            return
        }
        Log.d(LOG_TAG, "User confirmed signer approval for request ID: ${request.id}")
        _state.update { it.copy(pendingSignerConfirmation = null) }
        pendingTonConnectAction = TonConnectAction.SignData(request, viaSigner = true)
        tonConnectViewModel.approveSignData(request)
    }

    fun cancelSignerApproval() {
        val request = state.value.pendingSignerConfirmation
        if (request == null) {
            Log.w(LOG_TAG, "No pending signer confirmation to cancel")
            return
        }
        Log.d(LOG_TAG, "User cancelled signer approval for request ID: ${request.id}")
        _state.update { it.copy(pendingSignerConfirmation = null) }
        pendingTonConnectAction = TonConnectAction.SignData(request, viaSigner = true)
        tonConnectViewModel.rejectSignData(request, SIGNER_CONFIRMATION_CANCEL_REASON)
    }

    fun disconnectSession(sessionId: String) {
        sessionsViewModel.disconnectSession(sessionId)
    }

    fun openSendTransactionSheet(walletAddress: String) {
        val wallet = state.value.wallets.firstOrNull { it.address == walletAddress }
        if (wallet != null) {
            uiCoordinator.openSendTransactionSheet(wallet)
        }
    }

    fun sendLocalTransaction(walletAddress: String, recipient: String, amount: String, comment: String = "") {
        walletOperationsViewModel.sendLocalTransaction(walletAddress, recipient, amount, comment)
    }

    fun toggleWalletSwitcher() {
        uiCoordinator.toggleWalletSwitcher()
    }

    fun switchWallet(address: String) {
        walletOperationsViewModel.switchWallet(address)
    }

    /**
     * Update the NFTs ViewModel for the given wallet address.
     */
    private fun updateNftsViewModel(address: String?) {
        if (address == null) {
            _nftsViewModel.value = null
            currentNftsWalletAddress = null
            return
        }

        if (currentNftsWalletAddress == address && _nftsViewModel.value != null) {
            return
        }

        val wallet = lifecycleManager.tonWallets[address]
        if (wallet == null) {
            Log.w(LOG_TAG, "updateNftsViewModel: wallet not found for address $address")
            _nftsViewModel.value = null
            currentNftsWalletAddress = null
            return
        }

        _nftsViewModel.value = NFTsListViewModel(wallet)
        currentNftsWalletAddress = address
        Log.d(LOG_TAG, "updateNftsViewModel: created NFTsListViewModel for $address")
    }

    private fun attachTransactionHistoryViewModel(address: String?) {
        transactionsCollectors.forEach { it.cancel() }
        transactionsCollectors = emptyList()
        if (address == null) {
            activeTransactionHistoryViewModel.value = null
            currentTransactionsWalletAddress = null
            _state.update { current ->
                current.copy(
                    isLoadingTransactions = false,
                    wallets = current.wallets.map { it.copy(transactions = emptyList()) },
                )
            }
            return
        }

        val wallet = lifecycleManager.tonWallets[address]
        if (wallet == null) {
            Log.w(LOG_TAG, "attachTransactionHistoryViewModel: wallet not found for $address")
            activeTransactionHistoryViewModel.value = null
            currentTransactionsWalletAddress = null
            _state.update { it.copy(isLoadingTransactions = false) }
            return
        }

        val viewModel = TransactionHistoryViewModel(wallet, lifecycleManager.transactionCache)
        activeTransactionHistoryViewModel.value = viewModel
        currentTransactionsWalletAddress = address

        val transactionsJob = viewModelScope.launch {
            viewModel.transactions.collect { transactions ->
                _state.update { current ->
                    val updatedWallets = current.wallets.map { summary ->
                        if (summary.address == address) {
                            summary.copy(transactions = transactions)
                        } else {
                            summary
                        }
                    }
                    current.copy(wallets = updatedWallets)
                }
            }
        }

        val stateJob = viewModelScope.launch {
            viewModel.state.collect { historyState ->
                _state.update { current ->
                    val errorMessage = if (historyState is TransactionHistoryViewModel.TransactionState.Error) {
                        historyState.message
                    } else {
                        current.error
                    }
                    current.copy(
                        isLoadingTransactions = historyState is TransactionHistoryViewModel.TransactionState.Loading,
                        error = errorMessage,
                    )
                }
            }
        }

        transactionsCollectors = listOf(transactionsJob, stateJob)
        viewModel.loadTransactions(limit = TRANSACTION_FETCH_LIMIT)
    }

    private fun attachJettonsViewModel(address: String?) {
        jettonsCollectors.forEach { it.cancel() }
        jettonsCollectors = emptyList()
        if (address == null) {
            activeJettonsViewModel.value = null
            currentJettonsWalletAddress = null
            _state.update {
                it.copy(
                    jettons = emptyList(),
                    isLoadingJettons = false,
                    jettonsError = null,
                    canLoadMoreJettons = false,
                )
            }
            return
        }

        val wallet = lifecycleManager.tonWallets[address]
        if (wallet == null) {
            Log.w(LOG_TAG, "attachJettonsViewModel: wallet not found for $address")
            activeJettonsViewModel.value = null
            currentJettonsWalletAddress = null
            _state.update {
                it.copy(
                    jettons = emptyList(),
                    isLoadingJettons = false,
                    jettonsError = uiString(R.string.wallet_error_wallet_not_found),
                    canLoadMoreJettons = false,
                )
            }
            return
        }

        val viewModel = JettonsListViewModel(wallet)
        activeJettonsViewModel.value = viewModel
        currentJettonsWalletAddress = address

        val dataJob = viewModelScope.launch {
            viewModel.jettons.collect { jettons ->
                val summaries = jettons.map { JettonSummary.from(it) }
                _state.update {
                    it.copy(
                        jettons = summaries,
                        canLoadMoreJettons = viewModel.canLoadMore,
                    )
                }
            }
        }

        val stateJob = viewModelScope.launch {
            viewModel.state.collect { jettonState ->
                _state.update { current ->
                    val errorMessage = when (jettonState) {
                        is JettonsListViewModel.JettonState.Error -> jettonState.message
                        JettonsListViewModel.JettonState.Loading -> null
                        else -> null
                    }
                    current.copy(
                        isLoadingJettons = jettonState is JettonsListViewModel.JettonState.Loading,
                        jettonsError = errorMessage,
                        canLoadMoreJettons = viewModel.canLoadMore,
                    )
                }
            }
        }

        val transferErrorJob = viewModelScope.launch {
            viewModel.transferError.collect { error ->
                if (error != null) {
                    _state.update { it.copy(error = error) }
                    viewModel.clearTransferError()
                }
            }
        }

        jettonsCollectors = listOf(dataJob, stateJob, transferErrorJob)
        viewModel.loadJettons()
    }

    fun refreshTransactions(address: String? = state.value.activeWalletAddress, limit: Int = TRANSACTION_FETCH_LIMIT) {
        val targetAddress = address ?: return
        if (currentTransactionsWalletAddress != targetAddress) {
            attachTransactionHistoryViewModel(targetAddress)
            return
        }
        activeTransactionHistoryViewModel.value?.loadTransactions(limit = limit)
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
        uiCoordinator.showTransactionDetail(SheetState.TransactionDetail(detail))
    }

    fun removeWallet(address: String) {
        viewModelScope.launch {
            val wallet = lifecycleManager.tonWallets[address]
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
            lifecycleManager.tonWallets.remove(address)

            runCatching { storage.clear(address) }
                .onSuccess { Log.d(LOG_TAG, "removeWallet: cleared storage entry for $address") }
                .onFailure { Log.w(LOG_TAG, "removeWallet: failed to clear storage for $address", it) }

            // Clear transaction cache for removed wallet
            lifecycleManager.transactionCache.clear(address)

            lifecycleManager.walletMetadata.remove(address)

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
                lifecycleManager.persistActiveWalletPreference(updatedActiveAddress)
            }

            updateNftsViewModel(updatedActiveAddress)
            attachTransactionHistoryViewModel(updatedActiveAddress)
            attachJettonsViewModel(updatedActiveAddress)

            refreshWallets()
            sessionsViewModel.refresh() // Refresh to update UI with removed sessions

            eventLogger.log(R.string.wallet_event_wallet_removed, walletName)
        }
    }

    fun renameWallet(address: String, newName: String) {
        val metadata = lifecycleManager.walletMetadata[address]
        if (metadata == null) {
            _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
            return
        }

        val updated = metadata.copy(name = newName.ifBlank { defaultWalletName(0) })
        lifecycleManager.walletMetadata[address] = updated

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
            eventLogger.log(R.string.wallet_event_wallet_renamed, newName)
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
        uiCoordinator.setSheet(SheetState.Connect(uiRequest), savePrevious = shouldSavePrevious)

        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        eventLogger.log(R.string.wallet_event_connect_request, eventDAppName)
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
        uiCoordinator.setSheet(SheetState.Transaction(uiRequest))
        Log.d(LOG_TAG, "Sheet state updated: ${state.value.sheetState}")
        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        eventLogger.log(R.string.wallet_event_transaction_request, eventDAppName)
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

        uiCoordinator.setSheet(SheetState.SignData(uiRequest))
        val eventDAppName = dAppInfo?.name ?: fallbackDAppName
        eventLogger.log(R.string.wallet_event_sign_data_request, eventDAppName)
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
        val publicKey = kit.derivePublicKey(mnemonic)

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
                val result = kit.signDataWithMnemonic(
                    mnemonic = signerMnemonic,
                    data = data,
                    mnemonicType = "ton",
                )
                // Decode Base64 signature back to ByteArray
                return android.util.Base64.decode(result.signature, android.util.Base64.NO_WRAP)
            }
        }
    }

    // ========== Password Management ==========

    fun setupPassword(password: String) {
        viewModelScope.launch {
            try {
                securityController.setPassword(password)

                // Wait for SDK to initialize and wallets to load
                sdkInitialized.first { it }

                // If no wallets exist, automatically open add wallet sheet
                if (_state.value.wallets.isEmpty()) {
                    uiCoordinator.openAddWalletSheet()
                }
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to setup password", e)
                val reason = e.message ?: uiString(R.string.wallet_error_unknown)
                _state.update { it.copy(error = uiString(R.string.wallet_error_setup_password, reason)) }
            }
        }
    }

    fun unlockWallet(password: String): Boolean {
        val verified = securityController.verifyPassword(password)
        if (verified) {
            viewModelScope.launch {
                sdkInitialized.first { it }
                if (_state.value.wallets.isEmpty()) {
                    uiCoordinator.openAddWalletSheet()
                }
            }
            return true
        }
        _state.update { it.copy(error = uiString(R.string.wallet_error_incorrect_password)) }
        return false
    }

    fun lockWallet() {
        securityController.lock()
    }

    fun resetWallet() {
        viewModelScope.launch {
            try {
                // Remove all wallets from SDK first
                val allWallets = lifecycleManager.tonWallets.values.toList()
                allWallets.forEach { wallet ->
                    runCatching { wallet.remove() }.onFailure {
                        Log.w(LOG_TAG, "Failed to remove wallet during reset", it)
                    }
                }

                // Clear local caches
                lifecycleManager.clearCachesForReset()

                // Clear all stored data (including password)
                storage.clearAll()

                // Reset state
                securityController.reset()
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

    // ========================================================================
    // Jetton Management
    // ========================================================================

    /**
     * Load jettons for the active wallet.
     */
    fun loadJettons() {
        val address = state.value.activeWalletAddress
        if (address == null) {
            Log.w(LOG_TAG, "loadJettons: No active wallet")
            return
        }
        if (currentJettonsWalletAddress != address) {
            attachJettonsViewModel(address)
        } else {
            activeJettonsViewModel.value?.loadJettons()
        }
    }

    fun loadMoreJettons() {
        activeJettonsViewModel.value?.loadMoreJettons()
    }

    fun refreshJettons() {
        activeJettonsViewModel.value?.refresh()
    }

    /**
     * Show jetton details sheet.
     */
    fun showJettonDetails(jettonSummary: JettonSummary) {
        val jettonDetails = JettonDetails.from(jettonSummary.jettonWallet)
        uiCoordinator.showJettonDetails(jettonDetails)
    }

    /**
     * Show jetton transfer sheet.
     */
    fun showTransferJetton(jettonDetails: JettonDetails) {
        uiCoordinator.showTransferJetton(jettonDetails)
    }

    /**
     * Transfer jetton to another address.
     */
    fun transferJetton(jettonAddress: String, recipient: String, amount: String, comment: String) {
        val viewModel = activeJettonsViewModel.value
        if (viewModel == null) {
            _state.update { it.copy(error = uiString(R.string.wallet_error_wallet_not_found)) }
            return
        }
        viewModel.transferJetton(jettonAddress, recipient, amount, comment)
        dismissSheet()
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
    }
}
