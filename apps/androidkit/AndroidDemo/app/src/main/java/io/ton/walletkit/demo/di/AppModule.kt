package io.ton.walletkit.demo.di

import android.app.Application
import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.ton.walletkit.demo.core.WalletKitDemoApp
import io.ton.walletkit.demo.data.storage.DemoAppStorage
import io.ton.walletkit.demo.data.storage.SecureDemoAppStorage
import io.ton.walletkit.presentation.event.TONWalletKitEvent
import kotlinx.coroutines.flow.SharedFlow
import javax.inject.Singleton

/**
 * Hilt module providing app-level dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApplication(
        @ApplicationContext context: Context,
    ): Application = context.applicationContext as Application

    @Provides
    @Singleton
    fun provideWalletKitDemoApp(
        @ApplicationContext context: Context,
    ): WalletKitDemoApp = context.applicationContext as WalletKitDemoApp

    @Provides
    @Singleton
    fun provideDemoAppStorage(
        @ApplicationContext context: Context,
    ): DemoAppStorage = SecureDemoAppStorage(context)

    @Provides
    @Singleton
    fun provideSdkEvents(app: WalletKitDemoApp): @JvmSuppressWildcards SharedFlow<TONWalletKitEvent> = app.sdkEvents

    @Provides
    @Singleton
    fun provideSdkInitialized(app: WalletKitDemoApp): @JvmSuppressWildcards SharedFlow<Boolean> = app.sdkInitialized
}
