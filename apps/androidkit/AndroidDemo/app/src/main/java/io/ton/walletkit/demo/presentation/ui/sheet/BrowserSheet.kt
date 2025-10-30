package io.ton.walletkit.demo.presentation.ui.sheet

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.webkit.WebView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import io.ton.walletkit.demo.R
import io.ton.walletkit.presentation.TONWalletKit
import io.ton.walletkit.presentation.browser.cleanupTonConnect
import io.ton.walletkit.presentation.browser.injectTonConnect

@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrowserSheet(
    url: String,
    onClose: () -> Unit,
    walletKit: TONWalletKit,
    isLoading: Boolean = false,
    currentUrl: String = url,
    webViewHolder: androidx.compose.runtime.MutableState<WebView?>? = null,
) {
    val context = LocalContext.current

    // Use the provided WebView holder to persist the WebView across sheet changes
    // This prevents the WebView from being destroyed when the Connect sheet opens
    val webView = webViewHolder?.value ?: remember(url) {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )

            // Disable nested scrolling to allow WebView to handle all scroll events
            isNestedScrollingEnabled = false

            // Inject TonConnect support
            injectTonConnect(walletKit)

            // Load the URL
            loadUrl(url)
        }.also {
            // Store in holder if provided
            webViewHolder?.value = it
        }
    }

    // Don't destroy WebView if it's managed by the holder (parent composable owns it)
    DisposableEffect(Unit) {
        onDispose {
            if (webViewHolder == null) {
                // Clean up TonConnect resources before destroying
                webView.cleanupTonConnect()
                webView.destroy()
            }
            // If webViewHolder is provided, the parent composable is responsible for destruction
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(stringResource(R.string.browser_title)) },
            navigationIcon = {
                IconButton(onClick = onClose) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = stringResource(R.string.action_close),
                    )
                }
            },
        )

        // Status Bar
        Surface(
            modifier = Modifier.fillMaxWidth(),
            tonalElevation = 2.dp,
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
            ) {
                Text(
                    text = currentUrl.ifEmpty { stringResource(R.string.browser_loading) },
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                )
            }
        }

        // Loading indicator
        if (isLoading) {
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
                factory = { webView },
                modifier = Modifier.fillMaxSize(),
                update = { view ->
                    // Request parent to not intercept touch events
                    view.setOnTouchListener { v, event ->
                        v.parent?.requestDisallowInterceptTouchEvent(true)
                        false // Let WebView handle the event
                    }
                },
            )
        }
    }
}
