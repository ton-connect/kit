package io.ton.walletkit.demo.ui.preview

import io.ton.walletkit.demo.model.ConnectPermissionUi
import io.ton.walletkit.demo.model.ConnectRequestUi
import io.ton.walletkit.demo.model.SessionSummary
import io.ton.walletkit.demo.model.SignDataRequestUi
import io.ton.walletkit.demo.model.TonNetwork
import io.ton.walletkit.demo.model.TransactionMessageUi
import io.ton.walletkit.demo.model.TransactionRequestUi
import io.ton.walletkit.demo.model.WalletSummary
import io.ton.walletkit.demo.state.SheetState
import io.ton.walletkit.demo.state.WalletUiState
import org.json.JSONObject

object PreviewData {
    val wallet: WalletSummary = WalletSummary(
        address = "0:previewaddress",
        name = "Preview Wallet",
        network = TonNetwork.MAINNET,
        version = "v5r1",
        publicKey = "preview-public-key",
        balanceNano = "123456789",
        balance = "0.1234",
        transactions = null,
        lastUpdated = System.currentTimeMillis(),
    )

    val session: SessionSummary = SessionSummary(
        sessionId = "session-preview",
        dAppName = "Preview dApp",
        walletAddress = wallet.address,
        dAppUrl = "https://preview.app",
        manifestUrl = "https://preview.app/manifest",
        iconUrl = null,
        createdAt = System.currentTimeMillis(),
        lastActivity = System.currentTimeMillis(),
    )

    val connectRequest: ConnectRequestUi = ConnectRequestUi(
        id = "request-preview",
        dAppName = session.dAppName,
        dAppUrl = session.dAppUrl.orEmpty(),
        manifestUrl = session.manifestUrl.orEmpty(),
        iconUrl = null,
        permissions = listOf(
            ConnectPermissionUi(name = "ton_addr", title = "Wallet address", description = "Access to your wallet address"),
        ),
        requestedItems = listOf("ton_proof"),
        raw = JSONObject(mapOf("id" to "request-preview")),
    )

    val transactionRequest: TransactionRequestUi = TransactionRequestUi(
        id = "tx-preview",
        walletAddress = wallet.address,
        dAppName = session.dAppName,
        validUntil = null,
        messages = listOf(
            TransactionMessageUi(
                to = "0:recipient",
                amount = "1000000000",
                comment = null,
                payload = "payload",
                stateInit = null,
            ),
        ),
        preview = "{\n  \"action\": \"transfer\"\n}",
        raw = JSONObject(mapOf("id" to "tx-preview")),
    )

    val signDataRequest: SignDataRequestUi = SignDataRequestUi(
        id = "sign-preview",
        walletAddress = wallet.address,
        payloadType = "ton_proof",
        payloadContent = "{\n  \"domain\": \"preview\"\n}",
        preview = null,
        raw = JSONObject(mapOf("id" to "sign-preview")),
    )

    val uiState: WalletUiState = WalletUiState(
        initialized = true,
        status = "WalletKit ready",
        wallets = listOf(wallet),
        sessions = listOf(session),
        sheetState = SheetState.None,
        isUrlPromptVisible = false,
        isLoadingWallets = false,
        isLoadingSessions = false,
        error = null,
        events = listOf("Handled TON Connect URL", "Approved transaction"),
        lastUpdated = System.currentTimeMillis(),
    )
}
