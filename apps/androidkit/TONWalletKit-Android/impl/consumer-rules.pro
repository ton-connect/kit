# ============================================================
# TON WalletKit Android SDK - Consumer ProGuard Rules
# These rules are automatically applied to apps using this AAR
# ============================================================

# ------------------------------------------------------------
# 1. WebView JavaScript Interface
# Keep all methods annotated with @JavascriptInterface
# CRITICAL: JavaScript calls these methods by name at runtime
# ------------------------------------------------------------
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the JsBinding inner class used by WebView engine
-keepclassmembers class io.ton.walletkit.presentation.impl.WebViewWalletKitEngine$JsBinding {
    @android.webkit.JavascriptInterface <methods>;
}

# ------------------------------------------------------------
# 2. QuickJS Native Bridge (Full variant only)
# Keep QuickJsNativeHost for reflection-based instantiation by QuickJS
# ------------------------------------------------------------
-keep class io.ton.walletkit.presentation.impl.QuickJsNativeHost {
    <init>();
    public <methods>;
}

# Keep QuickJS JNI native methods
-keepclasseswithmembernames class io.ton.walletkit.presentation.impl.quickjs.QuickJs {
    native <methods>;
}

# ------------------------------------------------------------
# 3. Public API - Keep all public interfaces and classes
# Partners need access to these at runtime
# ------------------------------------------------------------
-keep public interface io.ton.walletkit.presentation.WalletKitEngine { *; }
-keep public class io.ton.walletkit.presentation.WalletKitEngineFactory { *; }
-keep public enum io.ton.walletkit.presentation.WalletKitEngineKind { *; }
-keep public class io.ton.walletkit.presentation.WalletKitBridgeException { *; }

# Keep configuration classes
-keep public class io.ton.walletkit.presentation.config.** { *; }

# Keep event classes and interfaces
-keep public class io.ton.walletkit.presentation.event.** { *; }
-keep public interface io.ton.walletkit.presentation.listener.** { *; }

# Keep request classes (used in events)
-keep public class io.ton.walletkit.presentation.request.** {
    public <methods>;
    public <fields>;
}

# Keep domain models (return types from API)
-keep public class io.ton.walletkit.domain.model.** {
    public <methods>;
    public <fields>;
}

# ------------------------------------------------------------
# 4. Kotlinx Serialization (ONLY for library's internal use)
# Keep ONLY what serialization needs at runtime
# Reference: https://github.com/Kotlin/kotlinx.serialization#android
# ------------------------------------------------------------

# Keep Serializer classes for library's internal serialized classes
-keepclassmembers class io.ton.walletkit.** {
    *** Companion;
}

-keepclasseswithmembers class io.ton.walletkit.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Preserve serializer names for library classes
-keep,includedescriptorclasses class io.ton.walletkit.**$$serializer { *; }

# Keep kotlinx.serialization runtime (library uses it internally)
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}

-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep generic signatures for serialization (only for library classes)
-keepattributes Signature
-keepattributes InnerClasses

# REMOVED: -keepattributes *Annotation* 
# Reason: This prevents optimizations in consumer apps. We don't need 
# to keep ALL annotations - only what's specifically required above.

# ------------------------------------------------------------
# 5. Reflection (used by WalletKitEngineFactory)
# Keep classes that are loaded via Class.forName()
# ------------------------------------------------------------

# Keep engine implementations for reflection-based factory
-keep class io.ton.walletkit.presentation.impl.WebViewWalletKitEngine {
    <init>(android.content.Context, java.lang.String);
}

-keep class io.ton.walletkit.presentation.impl.QuickJsWalletKitEngine {
    <init>(android.content.Context, java.lang.String, okhttp3.OkHttpClient);
}

# ------------------------------------------------------------
# 6. Android Security & Crypto
# Keep encrypted shared preferences (library uses internally)
# ------------------------------------------------------------
-keep class androidx.security.crypto.** { *; }
-keep class com.google.crypto.tink.** { *; }

# ------------------------------------------------------------
# 7. Coroutines (library uses internally)
# ------------------------------------------------------------
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Coroutines volatile fields optimization
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Avoid aggressive optimization breaking coroutines
-dontwarn kotlinx.coroutines.**

# ------------------------------------------------------------
# 8. OkHttp (Full variant only - used internally)
# ------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# OkHttp platform implementations
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ------------------------------------------------------------
# 9. JSON parsing (org.json - used for bridge communication)
# ------------------------------------------------------------
# org.json is part of Android SDK, no special rules needed

# ------------------------------------------------------------
# 10. AndroidX WebKit (used by WebView engine)
# ------------------------------------------------------------
-dontwarn androidx.webkit.**
