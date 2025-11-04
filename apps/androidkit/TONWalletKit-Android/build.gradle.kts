// Top-level build file for TONWalletKit-Android SDK
plugins {
    alias(libs.plugins.androidLibrary) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.spotless) apply false
}

// Apply Spotless formatting to all subprojects
subprojects {
    apply(plugin = "com.diffplug.spotless")
    
    configure<com.diffplug.gradle.spotless.SpotlessExtension> {
        kotlin {
            target("**/*.kt")
            targetExclude(
                "**/build/**/*.kt",
                "**/WalletKitEngineFactoryTest.kt",
            )
            ktlint("1.0.1")
                .editorConfigOverride(
                    mapOf(
                        "ktlint_standard_no-wildcard-imports" to "disabled",
                        "ktlint_standard_filename" to "disabled",
                    )
                )
        }
        kotlinGradle {
            target("**/*.gradle.kts")
            ktlint("1.0.1")
        }
    }
}

// Task to build WebView variant only (lightweight, recommended)
tasks.register("buildWebview") {
    group = "build"
    description = "Build WebView-only SDK variant (lightweight, no QuickJS)"
    
    dependsOn(":impl:bundleWebviewReleaseAar")
    
    doLast {
        println("✅ WebView variant built: impl-webview-release.aar (2.7M)")
        println("   Includes API + implementation, no QuickJS native libs")
    }
}

// Task to build Full variant with QuickJS
tasks.register("buildFull") {
    group = "build"
    description = "Build Full SDK variant (includes QuickJS)"
    
    dependsOn(":impl:bundleFullReleaseAar")
    
    doLast {
        println("✅ Full variant built: impl-full-release.aar (4.3M)")
        println("   Includes API + implementation + QuickJS native libs")
    }
}

// Task to build both variants
tasks.register("buildAllVariants") {
    group = "build"
    description = "Build all SDK variants (webview, full)"
    
    dependsOn("buildWebview", "buildFull")
}

// Task to build and copy WebView variant to demo (default, recommended)
tasks.register<Copy>("buildAndCopyWebviewToDemo") {
    group = "build"
    description = "Build WebView SDK variant and copy to AndroidDemo/app/libs (default)"
    
    dependsOn(":impl:bundleWebviewReleaseAar")
    
    from(layout.projectDirectory.file("impl/build/outputs/aar/impl-webview-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("impl-webview-release.aar", "tonwalletkit-release.aar")
    
    doLast {
        println("✅ WebView variant copied to AndroidDemo/app/libs/tonwalletkit-release.aar")
        println("   Size: ~2.7M (fat AAR with API + impl, no QuickJS)")
        println("   Demo app uses: WebView engine only")
    }
}

// Task to build and copy Full variant to demo
tasks.register<Copy>("buildAndCopyFullToDemo") {
    group = "build"
    description = "Build Full SDK variant (with QuickJS) and copy to AndroidDemo/app/libs"
    
    dependsOn(":impl:bundleFullReleaseAar")
    
    from(layout.projectDirectory.file("impl/build/outputs/aar/impl-full-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("impl-full-release.aar", "tonwalletkit-release.aar")
    
    doLast {
        println("✅ Full variant copied to AndroidDemo/app/libs/tonwalletkit-release.aar")
        println("   Size: ~4.3M (fat AAR with API + impl + QuickJS)")
        println("   Demo app uses: WebView + QuickJS engines")
    }
}

// Alias for backward compatibility (uses webview by default)
tasks.register("buildAndCopyToDemo") {
    group = "build"
    description = "Build and copy WebView variant to demo (alias for buildAndCopyWebviewToDemo)"
    
    dependsOn("buildAndCopyWebviewToDemo")
}

// Task to just copy existing WebView AAR without rebuilding
tasks.register<Copy>("copyWebviewToDemo") {
    group = "build"
    description = "Copy existing WebView AAR to demo (no rebuild)"
    
    from(layout.projectDirectory.file("impl/build/outputs/aar/impl-webview-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("impl-webview-release.aar", "tonwalletkit-release.aar")
    
    doLast {
        println("✅ Copied existing AAR to AndroidDemo/app/libs/tonwalletkit-release.aar")
    }
}

// Task to just copy existing Full AAR without rebuilding
tasks.register<Copy>("copyFullToDemo") {
    group = "build"
    description = "Copy existing Full AAR to demo (no rebuild)"
    
    from(layout.projectDirectory.file("impl/build/outputs/aar/impl-full-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("impl-full-release.aar", "tonwalletkit-release.aar")
    
    doLast {
        println("✅ Copied existing AAR to AndroidDemo/app/libs/tonwalletkit-release.aar")
    }
}
