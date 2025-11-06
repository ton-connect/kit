# ============================================================
# TON WalletKit Android SDK - Public API ProGuard Rules
# These rules ensure the public API remains readable and accessible
# while allowing internal implementation details to be obfuscated
# ============================================================

# ------------------------------------------------------------
# 1. Keep all public API classes, interfaces, and members
# This ensures developers can navigate through the API and read KDocs
# ------------------------------------------------------------

# Keep all public classes and interfaces in the main API package
-keep public class io.ton.walletkit.** { 
    public protected *; 
}

-keep public interface io.ton.walletkit.** { 
    *; 
}

# Keep all public enums
-keep public enum io.ton.walletkit.** { 
    *; 
}

# ------------------------------------------------------------
# 2. Preserve source file names and line numbers for stack traces
# This helps developers debug issues when using the SDK
# ------------------------------------------------------------
-keepattributes SourceFile,LineNumberTable

# ------------------------------------------------------------
# 3. Keep KDoc and annotations for IDE support
# Preserves documentation and nullability annotations for better IDE experience
# ------------------------------------------------------------
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# ------------------------------------------------------------
# 4. Kotlinx Serialization support for public API models
# ------------------------------------------------------------

# Keep Companion objects for serializable classes
-keepclassmembers class io.ton.walletkit.** {
    *** Companion;
}

# Keep serializer methods
-keepclasseswithmembers class io.ton.walletkit.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep generated serializers
-keep,includedescriptorclasses class io.ton.walletkit.**$$serializer { *; }

# ------------------------------------------------------------
# 5. Keep extension functions (they must remain accessible)
# ------------------------------------------------------------
-keep class io.ton.walletkit.extensions.** { *; }

# ------------------------------------------------------------
# 6. Exception handling - keep exception classes readable
# ------------------------------------------------------------
-keep public class * extends java.lang.Exception {
    public <init>(...);
}

# ------------------------------------------------------------
# 7. Preserve generic signatures for proper type inference
# ------------------------------------------------------------
-keepattributes Signature

# ------------------------------------------------------------
# IMPORTANT: Internal packages
# Classes under 'internal' packages are NOT part of the public API
# These will be obfuscated by the impl module's ProGuard rules
# but we document them here for clarity
# ------------------------------------------------------------
# io.ton.walletkit.internal.** - Internal utilities (will be obfuscated)
