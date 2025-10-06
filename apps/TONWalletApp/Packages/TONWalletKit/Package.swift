// swift-tools-version: 5.10
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TONWalletKit",
    platforms: [
        .iOS(.v14),
        .macOS(.v10_15),
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "TONWalletKit",
            targets: ["TONWalletKit"]),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "TONWalletKit",
            resources: [
                .process("Resources/JS/walletkit-ios-bridge.mjs"),
                .process("JSEngine/Polyfilling/Fetch/JS")
            ]
        ),
        .testTarget(
            name: "TONWalletKitTests",
            dependencies: ["TONWalletKit"]
        ),
    ]
)
