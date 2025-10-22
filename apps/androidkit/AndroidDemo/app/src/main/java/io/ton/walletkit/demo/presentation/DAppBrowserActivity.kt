package io.ton.walletkit.demo.presentation

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import io.ton.walletkit.demo.presentation.viewmodel.BrowserViewModel
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.browser.TONInternalBrowser

/**
 * Activity for testing the internal dApp browser with TonConnect support.
 *
 * This demonstrates:
 * - Opening a dApp in WebView with Compose
 * - Automatic TonConnect bridge injection
 * - Frame tracking for iframe support
 * - Automatic request forwarding to WalletKit engine
 *
 * **How it works:**
 * 1. TONWalletKit.openDApp() creates a WebView and injects the TonConnect bridge
 * 2. When the dApp calls window.tonwallet.tonconnect.connect(), the SDK automatically:
 *    - Captures the request in inject.mjs
 *    - Forwards it to the WalletKit engine via RPC
 *    - Processes it through bridge.ts
 *    - Emits events to WalletKitViewModel's TONBridgeEventsHandler
 * 3. Your app shows approval UI (handled in WalletKitViewModel)
 * 4. User approves/rejects → response automatically sent back to the dApp
 *
 * The eventListener is optional - it's just for UI updates (showing loading, request count, etc.)
 */
class DAppBrowserActivity : ComponentActivity() {

    private val viewModel: BrowserViewModel by viewModels { BrowserViewModel.factory() }
    private lateinit var browser: TONInternalBrowser

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dappUrl = intent.getStringExtra(EXTRA_DAPP_URL) ?: DEFAULT_DAPP_URL

        // Initialize browser - SDK handles everything automatically
        browser = TONWalletKit.openDApp(
            context = this,
            url = dappUrl,
            eventListener = { event ->
                // Optional: Update UI to show loading states, request notifications, etc.
                viewModel.handleBrowserEvent(event)
            },
        )

        setContent {
            MaterialTheme {
                BrowserScreen(
                    viewModel = viewModel,
                    browser = browser,
                    onBack = { finish() },
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        browser.close()
    }

    companion object {
        private const val EXTRA_DAPP_URL = "dapp_url"
        const val DEFAULT_DAPP_URL = "https://tonconnect-demo-dapp-with-react-ui.vercel.app/"

        /**
         * Start the dApp browser with the specified URL.
         */
        fun start(context: Context, dappUrl: String = DEFAULT_DAPP_URL) {
            val intent = Intent(context, DAppBrowserActivity::class.java).apply {
                putExtra(EXTRA_DAPP_URL, dappUrl)
            }
            context.startActivity(intent)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BrowserScreen(
    viewModel: BrowserViewModel,
    browser: TONInternalBrowser,
    onBack: () -> Unit,
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("dApp Browser") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            // Status Bar
            Surface(
                modifier = Modifier.fillMaxWidth(),
                tonalElevation = 2.dp,
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                ) {
                    Text(
                        text = state.currentUrl.ifEmpty { "Loading..." },
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 1,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = buildString {
                            append("Requests: ${state.requestCount}")
                            if (state.lastRequest != null) {
                                append(" • ${state.lastRequest}")
                            }
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Loading indicator
            if (state.isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            // WebView
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
            ) {
                AndroidView(
                    factory = { context ->
                        (browser.getView() ?: WebView(context)).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT,
                            )
                        }
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }

            // Error Snackbar
            state.error?.let { error ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("OK")
                        }
                    },
                ) {
                    Text(error)
                }
            }
        }
    }
}
