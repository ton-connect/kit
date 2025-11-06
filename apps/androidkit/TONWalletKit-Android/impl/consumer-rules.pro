# ============================================================
# TON WalletKit Android SDK - Implementation ProGuard Rules
# These rules protect internal implementation while keeping runtime requirements
# 
# STRATEGY:
# - Obfuscate all internal implementation classes (io.ton.walletkit.bridge.**)
# - Keep only what's required for runtime (reflection, JNI, JavaScript interface)
# - Public API visibility is handled by the api module's consumer-rules.pro
# ============================================================

# ------------------------------------------------------------
# 1. WebView JavaScript Interface
# Keep all methods annotated with @JavascriptInterface
# CRITICAL: JavaScript calls these methods by name at runtime
# ------------------------------------------------------------
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ------------------------------------------------------------
# 2. Reflection-based instantiation
# Keep constructors that are called via reflection
# These are internal implementation details but must work at runtime
# ------------------------------------------------------------

# Keep specific constructors used by factory pattern (obfuscate class names but keep constructors)
-keepclassmembers class io.ton.walletkit.bridge.** {
    public <init>(android.content.Context, java.lang.String);
    public <init>(android.content.Context, java.lang.String, okhttp3.OkHttpClient);
}

# ------------------------------------------------------------
# 3. QuickJS Native Bridge (Full variant only)
# Keep for JNI and reflection
# ------------------------------------------------------------

# Keep QuickJS JNI native methods (JNI requires exact method signatures)
-keepclasseswithmembernames class ** {
    native <methods>;
}

# ------------------------------------------------------------
# 4. Kotlinx Serialization (internal use only)
# Keep ONLY what serialization needs at runtime for impl classes
# ------------------------------------------------------------

# Keep Companion objects for serializable implementation classes
-keepclassmembers class io.ton.walletkit.bridge.** {
    *** Companion;
}

# Keep serializer methods for implementation
-keepclasseswithmembers class io.ton.walletkit.bridge.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Preserve serializer names for implementation classes
-keep,includedescriptorclasses class io.ton.walletkit.bridge.**$$serializer { *; }

# Keep kotlinx.serialization runtime
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}

-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# ------------------------------------------------------------
# 5. Preserve essential attributes for impl
# ------------------------------------------------------------

# Keep generic signatures for serialization
-keepattributes Signature

# Keep inner classes for proper compilation
-keepattributes InnerClasses

# Keep source file and line numbers for crash reports (but class names will be obfuscated)
-keepattributes SourceFile,LineNumberTable

# ------------------------------------------------------------
# 6. Android Security & Crypto (internal use)
# ------------------------------------------------------------
-keep class androidx.security.crypto.** { *; }
-keep class com.google.crypto.tink.** { *; }

# ------------------------------------------------------------
# 7. Coroutines (internal use)
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
# 8. OkHttp (Full variant only - internal use)
# ------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# OkHttp platform implementations
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ------------------------------------------------------------
# 9. AndroidX WebKit (internal use)
# ------------------------------------------------------------
-dontwarn androidx.webkit.**

# ------------------------------------------------------------
# 10. OPTIMIZATION SETTINGS
# Apply optimization to implementation code while preserving runtime requirements
# ------------------------------------------------------------

# Apply optimization passes
-optimizationpasses 5

# Allow ProGuard to modify access modifiers for better optimization
-allowaccessmodification

# Merge interfaces aggressively to reduce DEX size
-mergeinterfacesaggressively

# ------------------------------------------------------------
# 11. IMPLEMENTATION OBFUSCATION
# All implementation details will be obfuscated
# Only runtime-required members (JavascriptInterface, JNI, reflection) are kept
# ------------------------------------------------------------
# Implementation classes in io.ton.walletkit.bridge.** will have:
# - Obfuscated class names (except where kept for reflection/JNI)
# - Obfuscated method names (except @JavascriptInterface, public constructors, native methods)
# - Obfuscated field names
# - Removed debug information (except line numbers for crash reports)



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
