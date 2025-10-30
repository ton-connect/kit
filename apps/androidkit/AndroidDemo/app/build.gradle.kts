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
    implementation(libs.androidxSecurityCrypto)
    implementation(libs.coilCompose)
    implementation(libs.coilNetwork)

    // TONWalletKit SDK - AAR file
    // Build and copy with: ./gradlew buildAndCopyWebviewToDemo (or buildAndCopyFullToDemo)
    implementation(files("libs/bridge-release.aar"))

    // Required transitive dependencies (must be declared manually with AAR files)
    implementation(libs.androidxWebkit)
    implementation(libs.androidxDatastorePreferences)
    implementation(libs.kotlinxSerializationJson)
    // OkHttp only needed if using full variant:
    // implementation(libs.okhttp)

    debugImplementation(libs.leakcanaryAndroid)
}
