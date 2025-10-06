package io.ton.walletkit.demo

import android.util.Log
import io.ton.walletkit.bridge.WalletKitEngineKind
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Performance metrics for comparing QuickJS vs WebView engines.
 */
data class PerformanceMetrics(
    val engineKind: WalletKitEngineKind,
    val runNumber: Int,
    val engineCreationMs: Long = 0,
    val initMs: Long = 0,
    val addWalletMs: Long = 0,
    val getAccountMs: Long = 0,
    val getBalanceMs: Long = 0,
    val signTransactionMs: Long = 0,
    val totalStartupMs: Long = 0,
) {
    fun toCsvRow(): String = "${engineKind.name},$runNumber,$engineCreationMs,$initMs,$addWalletMs,$getAccountMs,$getBalanceMs,$signTransactionMs,$totalStartupMs"

    companion object {
        fun csvHeader(): String = "Engine,Run,EngineCreation(ms),Init(ms),AddWallet(ms),GetAccount(ms),GetBalance(ms),SignTransaction(ms),TotalStartup(ms)"
    }
}

/**
 * Collects and displays performance metrics for engine comparison.
 */
object PerformanceCollector {
    private const val TAG = "PerformanceCollector"

    private val _metrics = MutableStateFlow<List<PerformanceMetrics>>(emptyList())
    val metrics: StateFlow<List<PerformanceMetrics>> = _metrics.asStateFlow()

    private var currentMetric: PerformanceMetrics? = null
    private var startupStartTime: Long = 0

    fun startMeasurement(engineKind: WalletKitEngineKind, runNumber: Int) {
        startupStartTime = System.currentTimeMillis()
        currentMetric = PerformanceMetrics(engineKind = engineKind, runNumber = runNumber)
        Log.d(TAG, "Started measurement for ${engineKind.name} run #$runNumber")
    }

    fun recordEngineCreation(durationMs: Long) {
        currentMetric = currentMetric?.copy(engineCreationMs = durationMs)
        Log.d(TAG, "Engine creation: ${durationMs}ms")
    }

    fun recordInit(durationMs: Long) {
        currentMetric = currentMetric?.copy(initMs = durationMs)
        Log.d(TAG, "Init: ${durationMs}ms")
    }

    fun recordAddWallet(durationMs: Long) {
        currentMetric = currentMetric?.copy(addWalletMs = durationMs)
        Log.d(TAG, "Add wallet: ${durationMs}ms")
    }

    fun recordGetAccount(durationMs: Long) {
        currentMetric = currentMetric?.copy(getAccountMs = durationMs)
        Log.d(TAG, "Get account: ${durationMs}ms")
    }

    fun recordGetBalance(durationMs: Long) {
        currentMetric = currentMetric?.copy(getBalanceMs = durationMs)
        Log.d(TAG, "Get balance: ${durationMs}ms")
    }

    fun recordSignTransaction(durationMs: Long) {
        currentMetric = currentMetric?.copy(signTransactionMs = durationMs)
        Log.d(TAG, "Sign transaction: ${durationMs}ms")
    }

    fun finishMeasurement() {
        val totalMs = System.currentTimeMillis() - startupStartTime
        val metric = currentMetric?.copy(totalStartupMs = totalMs) ?: return

        _metrics.update { it + metric }
        Log.d(TAG, "Finished measurement for ${metric.engineKind.name} run #${metric.runNumber}")
        Log.d(TAG, "Total startup: ${totalMs}ms")

        currentMetric = null
    }

    fun getStats(): String {
        val metricsMap = _metrics.value.groupBy { it.engineKind }

        val sb = StringBuilder()
        sb.appendLine("=== Performance Comparison ===\n")

        metricsMap.forEach { (engine, runs) ->
            sb.appendLine("${engine.name} (${runs.size} runs):")
            sb.appendLine("  Engine Creation: ${runs.map { it.engineCreationMs }.average().formatMs()} (${runs.map { it.engineCreationMs }.minOrNull()}ms - ${runs.map { it.engineCreationMs }.maxOrNull()}ms)")
            sb.appendLine("  Init:            ${runs.map { it.initMs }.average().formatMs()} (${runs.map { it.initMs }.minOrNull()}ms - ${runs.map { it.initMs }.maxOrNull()}ms)")
            sb.appendLine("  Add Wallet:      ${runs.map { it.addWalletMs }.average().formatMs()} (${runs.map { it.addWalletMs }.minOrNull()}ms - ${runs.map { it.addWalletMs }.maxOrNull()}ms)")
            sb.appendLine("  Get Account:     ${runs.map { it.getAccountMs }.average().formatMs()} (${runs.map { it.getAccountMs }.minOrNull()}ms - ${runs.map { it.getAccountMs }.maxOrNull()}ms)")
            sb.appendLine("  Get Balance:     ${runs.map { it.getBalanceMs }.average().formatMs()} (${runs.map { it.getBalanceMs }.minOrNull()}ms - ${runs.map { it.getBalanceMs }.maxOrNull()}ms)")
            sb.appendLine("  Total Startup:   ${runs.map { it.totalStartupMs }.average().formatMs()} (${runs.map { it.totalStartupMs }.minOrNull()}ms - ${runs.map { it.totalStartupMs }.maxOrNull()}ms)")
            sb.appendLine()
        }

        // Comparison
        if (metricsMap.size == 2) {
            val quickjs = metricsMap[WalletKitEngineKind.QUICKJS]
            val webview = metricsMap[WalletKitEngineKind.WEBVIEW]

            if (quickjs != null && webview != null) {
                sb.appendLine("=== Speed Comparison (QuickJS vs WebView) ===")
                sb.appendLine("Engine Creation: ${compareMetrics(quickjs.map { it.engineCreationMs }, webview.map { it.engineCreationMs })}")
                sb.appendLine("Init:            ${compareMetrics(quickjs.map { it.initMs }, webview.map { it.initMs })}")
                sb.appendLine("Add Wallet:      ${compareMetrics(quickjs.map { it.addWalletMs }, webview.map { it.addWalletMs })}")
                sb.appendLine("Get Account:     ${compareMetrics(quickjs.map { it.getAccountMs }, webview.map { it.getAccountMs })}")
                sb.appendLine("Get Balance:     ${compareMetrics(quickjs.map { it.getBalanceMs }, webview.map { it.getBalanceMs })}")
                sb.appendLine("Total Startup:   ${compareMetrics(quickjs.map { it.totalStartupMs }, webview.map { it.totalStartupMs })}")
            }
        }

        return sb.toString()
    }

    fun exportCsv(): String {
        val sb = StringBuilder()
        sb.appendLine(PerformanceMetrics.csvHeader())
        _metrics.value.forEach { metric ->
            sb.appendLine(metric.toCsvRow())
        }
        return sb.toString()
    }

    fun clear() {
        _metrics.value = emptyList()
        currentMetric = null
        Log.d(TAG, "Cleared all metrics")
    }

    private fun Double.formatMs(): String = "%.1fms".format(this)

    private fun compareMetrics(quickjs: List<Long>, webview: List<Long>): String {
        val qAvg = quickjs.average()
        val wAvg = webview.average()
        val diff = ((qAvg - wAvg) / wAvg * 100).toInt()
        val faster = if (qAvg < wAvg) "QuickJS faster" else "WebView faster"
        return "$faster by ${kotlin.math.abs(diff)}% (${qAvg.formatMs()} vs ${wAvg.formatMs()})"
    }
}

/**
 * Helper to measure execution time of a suspend function.
 */
suspend inline fun <T> measureTime(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    val duration = System.currentTimeMillis() - start
    return result to duration
}
