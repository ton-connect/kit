package io.ton.walletkit.presentation.impl.quickjs

/**
 * QuickJS exception.
 * @suppress Internal implementation class. Not part of public API.
 */
internal class QuickJsException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
