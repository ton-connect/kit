# ============================================================
# TON WalletKit Android SDK - API Module ProGuard Rules
# These rules are used during API module builds (debug/release)
# For consumer apps, see consumer-rules.pro
# ============================================================

# The API module should never be obfuscated as it defines the public interface
# This file is used during library builds, but the API stays readable

# Keep source file names and line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Don't obfuscate the public API
-dontobfuscate

# Keep all API classes and members
-keep class io.ton.walletkit.** { *; }

# Keep all annotations for proper IDE support
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
