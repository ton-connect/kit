//
//  SceneDelegate.swift
//  IOSKitDemo
//
//  Scene delegate for iOS 13+ window management
//

import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Use this method to optionally configure and attach the UIWindow `window` to the provided UIWindowScene `scene`.
        // If using a storyboard, the `window` property will automatically be initialized and attached to the scene.
        // This delegate does not imply the connecting scene or session are new (see `application:configurationForConnectingSceneSession` instead).
        
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        // Configure window for TonConnect
        setupWindow(windowScene: windowScene)
        
        print("✅ Scene connected and window configured")
    }
    
    private func setupWindow(windowScene: UIWindowScene) {
        // Create window
        window = UIWindow(windowScene: windowScene)
        
        // Create root view controller
        let mainViewController = ViewController()
        let navigationController = UINavigationController(rootViewController: mainViewController)
        
        // Configure navigation controller
        navigationController.navigationBar.prefersLargeTitles = true
        
        // Set root view controller
        window?.rootViewController = navigationController
        window?.makeKeyAndVisible()
        
        // Configure window appearance
        window?.backgroundColor = UIColor.systemBackground
        window?.tintColor = UIColor.systemBlue
        
        #if DEBUG
        print("🔧 Window setup completed in debug mode")
        #endif
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Called as the scene is being released by the system.
        // This occurs shortly after the scene enters the background, or when its session is discarded.
        // Release any resources associated with this scene that can be re-created the next time the scene connects.
        // The scene may re-connect later, as its session was not necessarily discarded (see `application:didDiscardSceneSessions` instead).
        
        print("📱 Scene disconnected")
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Called when the scene has moved from an inactive state to an active state.
        // Use this method to restart any tasks that were paused (or not yet started) when the scene was inactive.
        
        print("📱 Scene became active")
        
        // Notify TonConnect bridge that app is active
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        // Called when the scene will move from an active state to an inactive state.
        // This may occur due to temporary interruptions (ex. an incoming phone call).
        
        print("📱 Scene will resign active")
        
        // Notify TonConnect bridge that app will become inactive
        NotificationCenter.default.post(name: UIApplication.willResignActiveNotification, object: nil)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        // Called as the scene transitions from the background to the foreground.
        // Use this method to undo the changes made on entering the background.
        
        print("📱 Scene entering foreground")
        
        // Refresh TonConnect bridge state if needed
        NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Called as the scene transitions from the foreground to the background.
        // Use this method to save data, release shared resources, and store enough scene-specific state information
        // to restore the scene back to its current state.
        
        print("📱 Scene entered background")
        
        // Save any important state for TonConnect
        NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
    }
}

// MARK: - URL Handling
extension SceneDelegate {
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Handle URL schemes if TonConnect needs deep linking
        for context in URLContexts {
            let url = context.url
            print("📱 Opening URL: \(url)")
            
            // Handle TonConnect URLs if needed
            if url.scheme == "tonconnect" || url.host == "tonconnect" {
                handleTonConnectURL(url)
            }
        }
    }
    
    private func handleTonConnectURL(_ url: URL) {
        // Handle TonConnect deep links
        print("🔗 Handling TonConnect URL: \(url)")
        
        // Post notification for TonConnect bridge to handle
        let userInfo = ["url": url]
        NotificationCenter.default.post(
            name: Notification.Name("TonConnectURLReceived"),
            object: nil,
            userInfo: userInfo
        )
    }
}

