package io.ton.walletkit.demo

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.ton.walletkit.bridge.WalletKitEngine
import io.ton.walletkit.bridge.WalletKitEngineKind
import io.ton.walletkit.bridge.config.WalletKitBridgeConfig
import io.ton.walletkit.storage.WalletKitStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BenchmarkState(
    val isRunning: Boolean = false,
    val currentEngine: WalletKitEngineKind? = null,
    val currentRun: Int = 0,
    val totalRuns: Int = 0,
    val status: String = "Ready to benchmark",
)

class PerformanceBenchmarkViewModel(
    private val app: WalletKitDemoApp,
    private val storage: WalletKitStorage,
) : ViewModel() {

    private val _state = MutableStateFlow(BenchmarkState())
    val state: StateFlow<BenchmarkState> = _state.asStateFlow()

    // Use a valid 24-word mnemonic (same as DEMO_MNEMONIC in WalletKitViewModel)
    private val testMnemonic =
        listOf(
            "canvas",
            "puzzle",
            "ski",
            "divide",
            "crime",
            "arrow",
            "object",
            "canvas",
            "point",
            "cover",
            "method",
            "bargain",
            "siren",
            "bean",
            "shrimp",
            "found",
            "gravity",
            "vivid",
            "pelican",
            "replace",
            "tuition",
            "screen",
            "orange",
            "album",
        )

    fun runBenchmark(engineKind: WalletKitEngineKind, runs: Int) {
        if (_state.value.isRunning) return

        viewModelScope.launch {
            _state.update {
                it.copy(
                    isRunning = true,
                    currentEngine = engineKind,
                    currentRun = 0,
                    totalRuns = runs,
                    status = "Starting ${engineKind.name} benchmark...",
                )
            }

            repeat(runs) { runIndex ->
                val runNumber = runIndex + 1
                _state.update {
                    it.copy(
                        currentRun = runNumber,
                        status = "Running ${engineKind.name} #$runNumber/$runs",
                    )
                }

                runSingleBenchmark(engineKind, runNumber)

                // Give system a moment to stabilize between runs
                kotlinx.coroutines.delay(500)
            }

            _state.update {
                it.copy(
                    isRunning = false,
                    currentEngine = null,
                    currentRun = 0,
                    totalRuns = 0,
                    status = "Completed ${engineKind.name} benchmark ($runs runs)",
                )
            }
        }
    }

    private suspend fun runSingleBenchmark(engineKind: WalletKitEngineKind, runNumber: Int) {
        PerformanceCollector.startMeasurement(engineKind, runNumber)

        var engine: WalletKitEngine? = null
        try {
            // 1. Engine Creation
            val (createdEngine, engineCreationTime) =
                measureTime {
                    app.obtainEngine(engineKind)
                }
            engine = createdEngine
            PerformanceCollector.recordEngineCreation(engineCreationTime)
            Log.d(TAG, "[$engineKind #$runNumber] Engine created in ${engineCreationTime}ms")

            // 2. Init
            val config =
                WalletKitBridgeConfig(
                    network = "mainnet",
                )
            val (initResult, initTime) =
                measureTime {
                    engine.init(config)
                }
            PerformanceCollector.recordInit(initTime)
            Log.d(TAG, "[$engineKind #$runNumber] Init completed in ${initTime}ms")

            // 3. Add Wallet
            val (wallet, addWalletTime) =
                measureTime {
                    engine.addWalletFromMnemonic(
                        words = testMnemonic,
                        version = "v5r1",
                        network = "mainnet",
                    )
                }
            PerformanceCollector.recordAddWallet(addWalletTime)
            Log.d(TAG, "[$engineKind #$runNumber] Add wallet completed in ${addWalletTime}ms")

            // 4. Get Wallets (replaces getAccount)
            val (wallets, getWalletsTime) =
                measureTime {
                    engine.getWallets()
                }
            PerformanceCollector.recordGetAccount(getWalletsTime)
            Log.d(TAG, "[$engineKind #$runNumber] Get wallets completed in ${getWalletsTime}ms")

            val firstWallet = wallets.firstOrNull()
            if (firstWallet != null) {
                // 5. Get Wallet State (includes balance)
                val (state, getStateTime) =
                    measureTime {
                        engine.getWalletState(firstWallet.address)
                    }
                PerformanceCollector.recordGetBalance(getStateTime)
                Log.d(TAG, "[$engineKind #$runNumber] Get state completed in ${getStateTime}ms")
            } else {
                Log.w(TAG, "[$engineKind #$runNumber] No wallets found, skipping get state")
            }

            Log.d(TAG, "[$engineKind #$runNumber] Benchmark completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "[$engineKind #$runNumber] Benchmark failed: ${e.message}", e)
        } finally {
            // Clean up
            try {
                engine?.destroy()
            } catch (e: Exception) {
                Log.e(TAG, "[$engineKind #$runNumber] Failed to destroy engine", e)
            }

            PerformanceCollector.finishMeasurement()
        }
    }

    companion object {
        private const val TAG = "PerformanceBenchmark"
    }
}

class PerformanceBenchmarkViewModelFactory(
    private val app: WalletKitDemoApp,
    private val storage: WalletKitStorage,
) : androidx.lifecycle.ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(PerformanceBenchmarkViewModel::class.java)) {
            return PerformanceBenchmarkViewModel(app, storage) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
