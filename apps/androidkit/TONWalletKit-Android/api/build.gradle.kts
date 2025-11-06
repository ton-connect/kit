plugins {
    alias(libs.plugins.androidLibrary)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.kotlinSerialization)
}

android {
    namespace = "io.ton.walletkit"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // API module doesn't need obfuscation - it's the public interface
            // Consumer rules will keep everything public
        }
    }

    // Enable generation of BuildConfig (needed for sources JAR task)
    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

// Generate sources JAR with KDocs for better IDE experience
val sourcesJar = tasks.register<Jar>("sourcesJar") {
    archiveClassifier.set("sources")
    from(android.sourceSets["main"].java.srcDirs)
    // Include all Kotlin source files with KDocs
    include("**/*.kt")
    include("**/*.java")
    // Exclude internal implementation details
    exclude("**/internal/**")
}

// Attach sources JAR to artifacts (for Maven publishing)
artifacts {
    archives(sourcesJar)
}

dependencies {
    // Minimal dependencies - only what public API needs
    api(libs.kotlinxSerializationJson)
    api(libs.kotlinxCoroutinesAndroid)
}
