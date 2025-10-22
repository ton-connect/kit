package io.ton.walletkit.domain.constants

/**
 * Constants for the internal browser and TonConnect bridge.
 */
internal object BrowserConstants {

    // JavaScript Interface
    const val JS_INTERFACE_NAME = "AndroidTonConnect"

    // Message Types
    const val MESSAGE_TYPE_BRIDGE_REQUEST = "TONCONNECT_BRIDGE_REQUEST"
    const val MESSAGE_TYPE_BRIDGE_RESPONSE = "TONCONNECT_BRIDGE_RESPONSE"
    const val MESSAGE_TYPE_BRIDGE_EVENT = "TONCONNECT_BRIDGE_EVENT"

    // JSON Keys
    const val KEY_TYPE = "type"
    const val KEY_FRAME_ID = "frameId"
    const val KEY_MESSAGE_ID = "messageId"
    const val KEY_METHOD = "method"
    const val KEY_EVENT = "event"
    const val KEY_SUCCESS = "success"
    const val KEY_PAYLOAD = "payload"

    // Default Values
    const val DEFAULT_FRAME_ID = "main"
    const val DEFAULT_METHOD = "unknown"

    // Asset Paths
    const val INJECT_SCRIPT_PATH = "walletkit/inject.mjs"

    // JavaScript Snippets
    const val JS_WINDOW_POST_MESSAGE = "window.postMessage"
    const val JS_SELECTOR_IFRAMES = "iframe"
    const val JS_PROPERTY_CONTENT_WINDOW = "contentWindow"
    const val JS_PROPERTY_CONTENT_DOCUMENT = "contentDocument"
    const val JS_PROPERTY_FRAME_ID = "__tonconnect_frameId"

    // Console Messages (for JavaScript logging)
    const val CONSOLE_PREFIX_NATIVE = "[TonConnect Native]"
    const val CONSOLE_MSG_FAILED_TO_INJECT = "Failed to inject bridge"
    const val CONSOLE_MSG_SKIPPED_CROSS_ORIGIN = "Skipped cross-origin iframe"
    const val CONSOLE_MSG_RESPONSE_SENT = "Response sent to frame"
    const val CONSOLE_MSG_FRAME_NOT_FOUND = "Frame not found"

    // WebView Progress Threshold
    const val WEBVIEW_INJECTION_PROGRESS_THRESHOLD = 80
}
