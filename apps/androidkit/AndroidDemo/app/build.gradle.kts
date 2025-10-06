import org.gradle.api.GradleException
import org.gradle.api.tasks.Copy
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.kotlinCompose)
}

android {
    namespace = "io.ton.walletkit.demo"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.ton.walletkit.demo"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
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
    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

val walletKitDistDir =
    rootProject.rootDir
        .toPath()
        .resolve("../dist-android")
        .toFile()
val walletKitQuickJsDistDir =
    rootProject.rootDir
        .toPath()
        .resolve("../dist-android-quickjs")
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
        description = "Copy WalletKit WebView bundle into Android assets."
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
        description = "Copy WalletKit QuickJS bundle into Android assets."
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

tasks.named("preBuild").configure {
    dependsOn(syncWalletKitWebViewAssets, syncWalletKitQuickJsAssets)
}

dependencies {
    implementation(libs.androidxCoreKtx)
    implementation(libs.androidxAppcompat)
    implementation(libs.googleMaterial)
    implementation(libs.androidxActivityKtx)
    implementation(libs.androidxConstraintLayout)
    implementation(libs.androidxActivityCompose)
    implementation(platform(libs.androidxComposeBom))
    implementation(libs.androidxComposeUi)
    implementation(libs.androidxComposeMaterial3)
    implementation(libs.androidxComposeMaterialIconsExtended)
    implementation(libs.androidxComposeUiToolingPreview)
    debugImplementation(libs.androidxComposeUiTooling)
    implementation(libs.androidxLifecycleRuntimeKtx)
    implementation(libs.androidxLifecycleViewmodelCompose)
    implementation(libs.kotlinxCoroutinesAndroid)
    implementation(project(":bridge"))
    implementation(project(":storage"))
}
