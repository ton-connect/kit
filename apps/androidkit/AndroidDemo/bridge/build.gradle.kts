import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.androidLibrary)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.spotless)
}

android {
    namespace = "io.ton.walletkit.bridge"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
        consumerProguardFiles("consumer-rules.pro")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        externalNativeBuild {
            cmake {
                arguments += listOf("-DANDROID_STL=c++_shared")
            }
        }

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86", "x86_64")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

// WalletKit Bundle Build & Copy Tasks
val walletKitDistDir =
    rootProject.rootDir
        .toPath()
        .resolve("../dist-android")
        .normalize()
        .toFile()
val walletKitQuickJsDistDir =
    rootProject.rootDir
        .toPath()
        .resolve("../dist-android-quickjs")
        .normalize()
        .toFile()
val walletKitAssetsDir = layout.projectDirectory.dir("src/main/assets/walletkit").asFile

// Task to build both WebView and QuickJS bundles using pnpm
val buildWalletKitBundles =
    tasks.register<Exec>("buildWalletKitBundles") {
        group = "walletkit"
        description = "Build both WebView and QuickJS WalletKit bundles using pnpm"
        workingDir = rootProject.rootDir.parentFile
        commandLine("sh", "-c", "pnpm run --filter androidkit build:all")
    }

// Task to copy WebView bundle
val syncWalletKitWebViewAssets =
    tasks.register<Copy>("syncWalletKitWebViewAssets") {
        group = "walletkit"
        description = "Copy WalletKit WebView bundle into bridge module assets (packaged in AAR)."
        dependsOn(buildWalletKitBundles)
        from(walletKitDistDir)
        into(walletKitAssetsDir)
        includeEmptyDirs = false
        doFirst {
            if (!walletKitDistDir.exists()) {
                throw GradleException(
                    "WebView bundle not found at $walletKitDistDir after build.",
                )
            }
        }
    }

// Task to copy QuickJS bundle
val syncWalletKitQuickJsAssets =
    tasks.register<Copy>("syncWalletKitQuickJsAssets") {
        group = "walletkit"
        description = "Copy WalletKit QuickJS bundle into bridge module assets (packaged in AAR)."
        dependsOn(buildWalletKitBundles)
        from(walletKitQuickJsDistDir) {
            include("walletkit.quickjs.js")
            rename("walletkit.quickjs.js", "index.js")
        }
        into(walletKitAssetsDir.resolve("quickjs"))
        doFirst {
            if (!walletKitQuickJsDistDir.exists()) {
                throw GradleException(
                    "QuickJS bundle not found at $walletKitQuickJsDistDir after build.",
                )
            }
        }
    }

// Ensure bundles are built and copied before the bridge AAR is assembled
tasks.named("preBuild").configure {
    dependsOn(syncWalletKitWebViewAssets, syncWalletKitQuickJsAssets)
}

dependencies {
    implementation(libs.androidxCoreKtx)
    implementation(libs.androidxLifecycleRuntimeKtx)
    implementation(libs.kotlinxCoroutinesAndroid)
    implementation(libs.androidxWebkit)
    implementation(libs.okhttp)

    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinxCoroutinesTest)
    testImplementation(libs.androidxTestCore)
    testImplementation(libs.robolectric)
    androidTestImplementation(libs.androidxTestExt)
    androidTestImplementation(libs.androidxTestRunner)
    testImplementation(kotlin("test"))
}
