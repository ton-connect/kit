package io.ton.walletkit.demo.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import io.ton.walletkit.demo.PerformanceBenchmarkViewModel
import io.ton.walletkit.demo.PerformanceBenchmarkViewModelFactory
import io.ton.walletkit.demo.WalletKitDemoApp

class PerformanceActivity : ComponentActivity() {

    private val viewModel: PerformanceBenchmarkViewModel by viewModels {
        val app = application as WalletKitDemoApp
        PerformanceBenchmarkViewModelFactory(app, app.storage)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    val benchmarkState by viewModel.state.collectAsState()

                    PerformanceScreen(
                        benchmarkState = benchmarkState,
                        onRunBenchmark = viewModel::runBenchmark,
                    )
                }
            }
        }
    }
}
