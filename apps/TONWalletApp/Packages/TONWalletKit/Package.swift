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
    dependencies: [
        .package(url: "https://github.com/mhayes853/javascript-core-extras.git", from: "0.1.0")
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "TONWalletKit",
            dependencies: [
                .product(name: "JavaScriptCoreExtras", package: "javascript-core-extras")
            ],
            path: "./Sources",
            resources: [
                .process("TONWalletKit/Resources/JS/walletkit-ios-bridge.mjs")
            ]
        ),
        .testTarget(
            name: "TONWalletKitTests",
            dependencies: ["TONWalletKit"]
        ),
    ]
)
