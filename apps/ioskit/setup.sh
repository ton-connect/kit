#!/bin/bash

# Setup script for iOS Kit Demo
# This script helps verify the setup and provides useful commands

set -e

echo "🚀 iOS Kit Demo Setup Assistant"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/truecarry/GitHub/kit"
IOS_APP_PATH="$PROJECT_ROOT/apps/ioskit"
XCODE_PROJECT_PATH="$IOS_APP_PATH/IOSKitDemo/IOSKitDemo.xcodeproj"

echo -e "${BLUE}Checking project structure...${NC}"

# Check if we're in the right directory
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ Project root not found: $PROJECT_ROOT${NC}"
    echo "Please run this script from the correct location."
    exit 1
fi

echo -e "${GREEN}✅ Project root found${NC}"

# Check iOS app directory
if [ ! -d "$IOS_APP_PATH" ]; then
    echo -e "${RED}❌ iOS app directory not found: $IOS_APP_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ iOS app directory found${NC}"

# Check if source files exist
echo -e "${BLUE}Checking source files...${NC}"

files_to_check=(
    "$IOS_APP_PATH/src/bridge/TonConnectBridge.swift"
    "$IOS_APP_PATH/src/utils/BridgeTypes.swift"
    "$IOS_APP_PATH/src/web/index.html"
    "$IOS_APP_PATH/SETUP.md"
    "$IOS_APP_PATH/README.md"
    "$IOS_APP_PATH/package.json"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $(basename "$file")${NC}"
    else
        echo -e "${RED}❌ $(basename "$file") not found${NC}"
    fi
done

# Check if Xcode project exists
echo -e "${BLUE}Checking Xcode project...${NC}"

if [ -f "$XCODE_PROJECT_PATH" ]; then
    echo -e "${GREEN}✅ Xcode project found${NC}"
    
    # Detect project type
    if [ -f "$IOS_APP_PATH/IOSKitDemo/IOSKitDemo/ContentView.swift" ]; then
        echo -e "${BLUE}📱 SwiftUI project detected${NC}"
        echo -e "${BLUE}📖 Integration guide:${NC}"
        echo "   cat '$IOS_APP_PATH/SWIFTUI_INTEGRATION.md'"
    elif [ -f "$IOS_APP_PATH/IOSKitDemo/IOSKitDemo/ViewController.swift" ]; then
        echo -e "${BLUE}📱 UIKit project detected${NC}"
        echo -e "${BLUE}📖 Integration guide:${NC}"
        echo "   cat '$IOS_APP_PATH/XCODE_INTEGRATION.md'"
    else
        echo -e "${YELLOW}⚠️  Project type unknown${NC}"
        echo -e "${BLUE}📖 Check both guides:${NC}"
        echo "   cat '$IOS_APP_PATH/SWIFTUI_INTEGRATION.md'"
        echo "   cat '$IOS_APP_PATH/XCODE_INTEGRATION.md'"
    fi
    
    echo -e "${BLUE}📱 To open in Xcode:${NC}"
    echo "   open '$XCODE_PROJECT_PATH'"
else
    echo -e "${YELLOW}⚠️  Xcode project not found${NC}"
    echo -e "${BLUE}📋 To create Xcode project:${NC}"
    echo "   1. Open Xcode"
    echo "   2. File → New → Project"
    echo "   3. iOS → App"
    echo "   4. Name: IOSKitDemo"
    echo "   5. Language: Swift, Interface: SwiftUI or UIKit"
    echo "   6. Save to: $IOS_APP_PATH/"
    echo ""
    echo -e "${BLUE}📖 Detailed instructions:${NC}"
    echo "   cat '$IOS_APP_PATH/SETUP.md'"
fi

# Check pnpm workspace
echo -e "${BLUE}Checking workspace setup...${NC}"

cd "$PROJECT_ROOT"

if [ -f "pnpm-workspace.yaml" ]; then
    echo -e "${GREEN}✅ pnpm workspace configured${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm workspace not found${NC}"
fi

if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✅ pnpm installed${NC}"
    
    echo -e "${BLUE}Installing dependencies...${NC}"
    pnpm install
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm not found${NC}"
    echo "   Install with: npm install -g pnpm"
fi

echo ""
echo -e "${GREEN}🎉 Setup verification complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Create Xcode project if not done already"
echo "2. Add bridge files to Xcode project"
echo "3. Build and run in Xcode"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo "  Open setup guide:    cat '$IOS_APP_PATH/SETUP.md'"
echo "  Open README:         cat '$IOS_APP_PATH/README.md'"
echo "  Open Xcode project:  open '$XCODE_PROJECT_PATH'"
echo "  View web demo:       open '$IOS_APP_PATH/src/web/index.html'"
echo ""
echo -e "${BLUE}🔧 Development tips:${NC}"
echo "- Use Xcode's device simulator for testing"
echo "- Check console logs for bridge communication"
echo "- Enable Web Inspector for debugging (iOS 16.4+)"
echo ""
