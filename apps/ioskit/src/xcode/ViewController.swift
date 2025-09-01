//
//  ViewController.swift
//  IOSKitDemo
//
//  Main view controller that hosts the TonConnect bridge
//

import UIKit
import WebKit

class ViewController: UIViewController {
    
    // MARK: - Properties
    private var tonConnectBridge: TonConnectBridge?
    private var loadingIndicator: UIActivityIndicatorView!
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupTonConnectBridge()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Show loading indicator briefly
        loadingIndicator.startAnimating()
        
        // Hide loading after bridge is ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.loadingIndicator.stopAnimating()
        }
    }
    
    // MARK: - Setup
    private func setupUI() {
        view.backgroundColor = UIColor.systemBackground
        
        // Set up navigation
        navigationItem.title = "TonConnect Demo"
        navigationController?.navigationBar.prefersLargeTitles = true
        
        // Add loading indicator
        loadingIndicator = UIActivityIndicatorView(style: .large)
        loadingIndicator.color = UIColor.systemBlue
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loadingIndicator)
        
        NSLayoutConstraint.activate([
            loadingIndicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        
        // Add debug button in navigation bar (for development)
        #if DEBUG
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            title: "Debug",
            style: .plain,
            target: self,
            action: #selector(debugTapped)
        )
        #endif
    }
    
    private func setupTonConnectBridge() {
        // Create TonConnect bridge
        tonConnectBridge = TonConnectBridge()
        
        guard let bridge = tonConnectBridge else {
            print("❌ Failed to create TonConnect bridge")
            return
        }
        
        // Add as child view controller
        addChild(bridge)
        view.addSubview(bridge.view)
        
        // Set up constraints for bridge view
        bridge.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            bridge.view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            bridge.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bridge.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bridge.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        bridge.didMove(toParent: self)
        
        print("✅ TonConnect bridge initialized successfully")
    }
    
    // MARK: - Debug Actions
    #if DEBUG
    @objc private func debugTapped() {
        let alert = UIAlertController(title: "Debug Options", message: nil, preferredStyle: .actionSheet)
        
        alert.addAction(UIAlertAction(title: "Reload Bridge", style: .default) { [weak self] _ in
            self?.reloadBridge()
        })
        
        alert.addAction(UIAlertAction(title: "Show Bridge Info", style: .default) { [weak self] _ in
            self?.showBridgeInfo()
        })
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
    
    private func reloadBridge() {
        tonConnectBridge?.removeFromParent()
        tonConnectBridge?.view.removeFromSuperview()
        tonConnectBridge = nil
        
        setupTonConnectBridge()
        
        let alert = UIAlertController(title: "Bridge Reloaded", message: "TonConnect bridge has been reloaded", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    private func showBridgeInfo() {
        let message = """
        TonConnect Bridge Info:
        
        Bridge Status: \(tonConnectBridge != nil ? "Active" : "Inactive")
        WebView Status: \(tonConnectBridge?.view != nil ? "Loaded" : "Not Loaded")
        
        Debug Features:
        • Web Inspector (iOS 16.4+)
        • Console Logging
        • Bridge Communication Logs
        """
        
        let alert = UIAlertController(title: "Bridge Info", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    #endif
}

// MARK: - Error Handling
extension ViewController {
    private func showError(_ message: String) {
        DispatchQueue.main.async { [weak self] in
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self?.present(alert, animated: true)
        }
    }
}

