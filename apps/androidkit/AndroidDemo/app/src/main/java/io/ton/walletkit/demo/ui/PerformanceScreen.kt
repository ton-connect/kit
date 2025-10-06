package io.ton.walletkit.demo.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.BenchmarkState
import io.ton.walletkit.demo.PerformanceCollector

@Composable
fun PerformanceScreen(
    benchmarkState: BenchmarkState,
    onRunBenchmark: (engineKind: io.ton.walletkit.bridge.WalletKitEngineKind, runs: Int) -> Unit,
) {
    val context = LocalContext.current
    val metrics by PerformanceCollector.metrics.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text(
            text = "Performance Benchmark",
            style = MaterialTheme.typography.headlineMedium,
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Run multiple times to get accurate averages",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Status indicator
        if (benchmarkState.isRunning) {
            Card(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                ) {
                    Text(
                        text = benchmarkState.status,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    if (benchmarkState.totalRuns > 0) {
                        Text(
                            text = "Progress: ${benchmarkState.currentRun}/${benchmarkState.totalRuns}",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
            ) {
                Text(
                    text = "QuickJS Benchmark",
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.QUICKJS, 1) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("1 Run")
                    }
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.QUICKJS, 3) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("3 Runs")
                    }
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.QUICKJS, 5) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("5 Runs")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
            ) {
                Text(
                    text = "WebView Benchmark",
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.WEBVIEW, 1) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("1 Run")
                    }
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.WEBVIEW, 3) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("3 Runs")
                    }
                    Button(
                        onClick = { onRunBenchmark(io.ton.walletkit.bridge.WalletKitEngineKind.WEBVIEW, 5) },
                        modifier = Modifier.weight(1f),
                        enabled = !benchmarkState.isRunning,
                    ) {
                        Text("5 Runs")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedButton(
                onClick = { PerformanceCollector.clear() },
                modifier = Modifier.weight(1f),
                enabled = !benchmarkState.isRunning,
            ) {
                Text("Clear")
            }
            OutlinedButton(
                onClick = {
                    val text = PerformanceCollector.getStats()
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("Performance Results", text)
                    clipboard.setPrimaryClip(clip)
                    // You could show a Toast here if you want
                },
                modifier = Modifier.weight(1f),
                enabled = metrics.isNotEmpty() && !benchmarkState.isRunning,
            ) {
                Text("Copy Text")
            }
            Button(
                onClick = {
                    val csv = PerformanceCollector.exportCsv()
                    val sendIntent =
                        Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, csv)
                            type = "text/csv"
                        }
                    context.startActivity(Intent.createChooser(sendIntent, "Share CSV"))
                },
                modifier = Modifier.weight(1f),
                enabled = metrics.isNotEmpty() && !benchmarkState.isRunning,
            ) {
                Text("Share CSV")
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (metrics.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                ) {
                    Text(
                        text = "Results (${metrics.size} runs)",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = PerformanceCollector.getStats(),
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Monospace,
                    )
                }
            }
        }
    }
}
