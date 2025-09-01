//
//  AppDelegate.swift
//  IOSKitDemo
//
//  App delegate with TonConnect configuration
//

import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        print("🚀 IOSKit Demo starting up...")
        
        // Configure app appearance
        setupAppearance()
        
        // Configure for TonConnect
        setupTonConnectConfiguration()
        
        return true
    }
    
    private func setupAppearance() {
        // Configure navigation bar appearance
        if #available(iOS 13.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.systemBackground
            appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
            appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]
            
            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
        }
        
        // Set tint color
        if let window = UIApplication.shared.windows.first {
            window.tintColor = UIColor.systemBlue
        }
    }
    
    private func setupTonConnectConfiguration() {
        // Configure WebView user agent if needed
        // This can be useful for web analytics or server-side detection
        
        #if DEBUG
        print("🔧 Debug mode enabled")
        print("📱 Device: \(UIDevice.current.model)")
        print("📱 iOS Version: \(UIDevice.current.systemVersion)")
        #endif
        
        // Set up network configuration for WebView if needed
        configureNetworkSettings()
    }
    
    private func configureNetworkSettings() {
        // Configure URL cache for better performance
        let memoryCapacity = 50 * 1024 * 1024 // 50 MB
        let diskCapacity = 100 * 1024 * 1024   // 100 MB
        let cache = URLCache(memoryCapacity: memoryCapacity, diskCapacity: diskCapacity, diskPath: "tonconnect_cache")
        URLCache.shared = cache
        
        print("✅ Network cache configured")
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }
    
    // MARK: - Application Lifecycle
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        print("📱 App entered background")
        // Handle background state if needed for TonConnect
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        print("📱 App entering foreground")
        // Handle foreground state if needed for TonConnect
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        print("📱 App became active")
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        print("📱 App will resign active")
    }
}

// MARK: - Error Handling
extension AppDelegate {
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
    }
}

// MARK: - Memory Management
extension AppDelegate {
    func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
        print("⚠️ Memory warning received")
        
        // Clear caches if needed
        URLCache.shared.removeAllCachedResponses()
        
        // Post notification for TonConnect bridge to handle memory pressure
        NotificationCenter.default.post(name: UIApplication.didReceiveMemoryWarningNotification, object: nil)
    }
}

