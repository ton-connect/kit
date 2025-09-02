#!/bin/bash

# iOS Kit Native Setup Script
# This script sets up the native iOS development environment with Swift WalletKit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up iOS Kit (Native Swift)...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the ioskit directory.${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Error: Xcode is not installed. Please install Xcode from the App Store.${NC}"
    exit 1
fi

# Check Xcode version (requires 14+ for iOS 16+ features)
XCODE_VERSION=$(xcodebuild -version | head -n 1 | awk '{print $2}')
echo -e "${GREEN}✅ Xcode ${XCODE_VERSION} detected${NC}"

# Check for minimum Xcode version
if ! python3 -c "import sys; sys.exit(0 if float('${XCODE_VERSION}') >= 14.0 else 1)" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Xcode 14+ recommended for best compatibility${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Checking directory structure...${NC}"

# Check WalletKit Swift wrapper directories
if [ ! -d "src/walletkit" ]; then
    echo -e "${RED}❌ WalletKit source directory not found${NC}"
    exit 1
fi

if [ ! -d "src/walletkit/SwiftUI" ]; then
    echo -e "${RED}❌ WalletKit SwiftUI directory not found${NC}"
    exit 1
fi

if [ ! -d "src/demo" ]; then
    echo -e "${RED}❌ Demo source directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Directory structure verified${NC}"

# Check if WalletKit files exist
echo -e "${YELLOW}📄 Checking WalletKit Swift files...${NC}"

WALLETKIT_FILES=(
    "src/walletkit/WalletKitSwift.swift"
    "src/walletkit/WalletKitTypes.swift"
    "src/walletkit/WalletKitEngine.swift"
    "src/walletkit/SwiftUI/WalletKitView.swift"
    "src/walletkit/SwiftUI/WalletCard.swift"
    "src/walletkit/SwiftUI/SessionCard.swift"
    "src/walletkit/SwiftUI/RequestViews.swift"
    "src/walletkit/SwiftUI/AddWalletView.swift"
)

MISSING_FILES=0
for file in "${WALLETKIT_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo -e "${GREEN}✅ Found: $file${NC}"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FILES WalletKit files are missing${NC}"
    echo -e "${BLUE}💡 Please ensure all WalletKit Swift files have been created${NC}"
    exit 1
fi

# Check if demo app files exist
echo -e "${YELLOW}📱 Checking demo app files...${NC}"

DEMO_FILES=(
    "src/demo/IOSWalletKitDemoApp.swift"
    "src/demo/ContentView.swift"
    "src/demo/Info.plist"
)

MISSING_DEMO=0
for file in "${DEMO_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING_DEMO=$((MISSING_DEMO + 1))
    else
        echo -e "${GREEN}✅ Found: $file${NC}"
    fi
done

if [ $MISSING_DEMO -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_DEMO demo files are missing${NC}"
    echo -e "${BLUE}💡 Please ensure all demo app files have been created${NC}"
    exit 1
fi

# Check documentation
echo -e "${YELLOW}📚 Checking documentation...${NC}"

if [ -f "README_NATIVE.md" ]; then
    echo -e "${GREEN}✅ Native documentation found${NC}"
else
    echo -e "${YELLOW}⚠️  Native documentation (README_NATIVE.md) not found${NC}"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}📄 Creating .gitignore...${NC}"
    cat > .gitignore << 'EOF'
# Xcode
build/
DerivedData/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.moved-aside
*.xccheckout
*.xcscmblueprint

# Swift Package Manager
.swiftpm/
.build/

# CocoaPods
Pods/
*.xcworkspace

# Carthage
Carthage/Build/

# fastlane
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots/**/*.png
fastlane/test_output

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
*.temp
EOF
    echo -e "${GREEN}✅ .gitignore created${NC}"
else
    echo -e "${GREEN}✅ .gitignore already exists${NC}"
fi

# Validate Swift syntax (basic check)
echo -e "${YELLOW}🔍 Performing basic syntax validation...${NC}"

SWIFT_FILES=(
    "src/walletkit/WalletKitSwift.swift"
    "src/walletkit/WalletKitEngine.swift"
    "src/demo/IOSWalletKitDemoApp.swift"
    "src/demo/ContentView.swift"
)

SYNTAX_ERRORS=0
for file in "${SWIFT_FILES[@]}"; do
    # Basic syntax check - look for obvious issues
    if grep -q "import SwiftUI" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $file appears to have SwiftUI imports${NC}"
    elif grep -q "import Foundation" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $file appears to have Foundation imports${NC}"
    else
        echo -e "${YELLOW}⚠️  $file may be missing imports${NC}"
    fi
done

echo -e ""
echo -e "${GREEN}🎉 iOS Kit Native setup verification completed successfully!${NC}"
echo -e ""
echo -e "${BLUE}📖 Next Steps - Creating Xcode Project:${NC}"
echo -e ""
echo -e "${GREEN}1. Create New Xcode Project:${NC}"
echo -e "   • Open Xcode"
echo -e "   • File → New → Project"
echo -e "   • iOS → App"
echo -e "   • Product Name: TonWalletKit Demo"
echo -e "   • Interface: SwiftUI"
echo -e "   • Language: Swift"
echo -e "   • Save in this directory (apps/ioskit/)"
echo -e ""
echo -e "${GREEN}2. Add WalletKit Files:${NC}"
echo -e "   • Drag src/walletkit/ folder into Xcode project"
echo -e "   • Choose \"Create folder references\""
echo -e "   • Ensure files are added to your target"
echo -e ""
echo -e "${GREEN}3. Add Demo Files:${NC}"
echo -e "   • Replace default ContentView.swift with src/demo/ContentView.swift"
echo -e "   • Replace default App.swift with src/demo/IOSWalletKitDemoApp.swift"
echo -e "   • Replace Info.plist with src/demo/Info.plist"
echo -e ""
echo -e "${GREEN}4. Add Framework Dependencies:${NC}"
echo -e "   • Project Settings → General → Frameworks"
echo -e "   • Add WebKit.framework"
echo -e "   • Add Combine.framework (if not already included)"
echo -e ""
echo -e "${GREEN}5. Build and Run:${NC}"
echo -e "   • Select your target device/simulator"
echo -e "   • Build (⌘+B) and Run (⌘+R)"
echo -e ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   • Native Implementation: README_NATIVE.md"
echo -e "   • Integration Guides: XCODE_INTEGRATION.md, SWIFTUI_INTEGRATION.md"
echo -e ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • Use iOS 15.0+ deployment target for best compatibility"
echo -e "   • Enable \"Inspectable\" in WebView for debugging JavaScript"
echo -e "   • Check Console.app for JavaScript bridge logs"
echo -e ""
echo -e "${GREEN}🚀 Ready to build your native TON wallet!${NC}"
