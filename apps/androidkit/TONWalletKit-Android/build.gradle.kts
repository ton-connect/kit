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
    
    dependsOn(":bridge:assembleWebviewRelease")
    
    doLast {
        println("✅ WebView variant built: bridge-webview-release.aar (1.2M)")
        println("   No QuickJS native libs, no OkHttp dependency")
    }
}

// Task to build Full variant with QuickJS
tasks.register("buildFull") {
    group = "build"
    description = "Build Full SDK variant (includes QuickJS)"
    
    dependsOn(":bridge:assembleFullRelease")
    
    doLast {
        println("✅ Full variant built: bridge-full-release.aar (4.3M)")
        println("   Includes QuickJS native libs + OkHttp")
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
    
    dependsOn(":bridge:assembleWebviewRelease")
    
    from(layout.projectDirectory.file("bridge/build/outputs/aar/bridge-webview-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("bridge-webview-release.aar", "bridge-release.aar")
    
    doLast {
        println("✅ WebView variant copied to AndroidDemo/app/libs/bridge-release.aar")
        println("   Size: ~1.2M (no QuickJS)")
        println("   Demo app uses: WebView engine only")
    }
}

// Task to build and copy Full variant to demo
tasks.register<Copy>("buildAndCopyFullToDemo") {
    group = "build"
    description = "Build Full SDK variant (with QuickJS) and copy to AndroidDemo/app/libs"
    
    dependsOn(":bridge:assembleFullRelease")
    
    from(layout.projectDirectory.file("bridge/build/outputs/aar/bridge-full-release.aar"))
    into(layout.projectDirectory.dir("../AndroidDemo/app/libs"))
    rename("bridge-full-release.aar", "bridge-release.aar")
    
    doLast {
        println("✅ Full variant copied to AndroidDemo/app/libs/bridge-release.aar")
        println("   Size: ~4.3M (includes QuickJS)")
        println("   Demo app uses: WebView + QuickJS engines")
    }
}

// Alias for backward compatibility (uses webview by default)
tasks.register("buildAndCopyToDemo") {
    group = "build"
    description = "Build and copy WebView variant to demo (alias for buildAndCopyWebviewToDemo)"
    
    dependsOn("buildAndCopyWebviewToDemo")
}
