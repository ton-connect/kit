//
//  Color.swift
//  TONWalletApp
//
//  Created by Nikita Rodionov on 30.09.2025.
//

import SwiftUI

import SwiftUI

extension Color {
    // MARK: - Design System Colors
    struct TON {
        // Red Palette
        static let red50 = Color(hex: "#fef4f3")
        static let red100 = Color(hex: "#fde6e4")
        static let red200 = Color(hex: "#fccfc9")
        static let red300 = Color(hex: "#f9a89a")
        static let red400 = Color(hex: "#f36f5b")
        static let red500 = Color(hex: "#ed4c38")
        static let red600 = Color(hex: "#d93c2b")
        static let red700 = Color(hex: "#b82f23")
        static let red800 = Color(hex: "#962b22")
        static let red900 = Color(hex: "#7a2822")
        
        // Yellow Palette
        static let yellow50 = Color(hex: "#fefbf0")
        static let yellow100 = Color(hex: "#fef7d9")
        static let yellow200 = Color(hex: "#fdedb0")
        static let yellow300 = Color(hex: "#fbde7e")
        static let yellow400 = Color(hex: "#f7ca4b")
        static let yellow500 = Color(hex: "#f0b52d")
        static let yellow600 = Color(hex: "#cf8e1c")
        static let yellow700 = Color(hex: "#a86918")
        static let yellow800 = Color(hex: "#88541a")
        static let yellow900 = Color(hex: "#70461a")
        
        // Green Palette
        static let green50 = Color(hex: "#f5fef7")
        static let green100 = Color(hex: "#e8fded")
        static let green300 = Color(hex: "#b3f1c2")
        static let green500 = Color(hex: "#5bd97b")
        static let green600 = Color(hex: "#3cb85e")
        static let green700 = Color(hex: "#2e9448")
        static let green800 = Color(hex: "#28753d")
        static let green900 = Color(hex: "#246136")
        
        // Blue Palette
        static let blue50 = Color(hex: "#f4f7fe")
        static let blue100 = Color(hex: "#e3ebfc")
        static let blue200 = Color(hex: "#d0dcf9")
        static let blue300 = Color(hex: "#b0c7f5")
        static let blue500 = Color(hex: "#5c8bef")
        static let blue600 = Color(hex: "#3c6fe3")
        static let blue700 = Color(hex: "#2f5bd0")
        static let blue800 = Color(hex: "#2b4aa8")
        static let blue900 = Color(hex: "#284084")
        
        // Purple Palette
        static let purple50 = Color(hex: "#faf7fe")
        static let purple100 = Color(hex: "#f1ebfc")
        static let purple600 = Color(hex: "#9333ea")
        
        // Pink Palette
        static let pink50 = Color(hex: "#fef4f8")
        
        // Gray Palette
        static let gray50 = Color(hex: "#fafafa")
        static let gray100 = Color(hex: "#f5f5f5")
        static let gray200 = Color(hex: "#e7e7e7")
        static let gray300 = Color(hex: "#d4d4d4")
        static let gray400 = Color(hex: "#a3a3a3")
        static let gray500 = Color(hex: "#737373")
        static let gray600 = Color(hex: "#525252")
        static let gray700 = Color(hex: "#404040")
        static let gray900 = Color(hex: "#171717")
        
        // Base Colors
        static let black = Color(hex: "#000000")
        static let white = Color(hex: "#ffffff")
    }
}

// MARK: - Design System Spacing
struct AppSpacing {
    static let base: CGFloat = 4 // 0.25rem = 4pt
    
    static func spacing(_ multiplier: CGFloat) -> CGFloat {
        return base * multiplier
    }
}

// MARK: - Design System Radius
struct AppRadius {
    static let standard: CGFloat = 10 // 0.625rem = 10pt
}

// MARK: - Design System Containers
struct AppContainer {
    static let md: CGFloat = 448 // 28rem = 448pt
    static let lg: CGFloat = 512 // 32rem = 512pt
    static let xl4: CGFloat = 896 // 56rem = 896pt
}

// MARK: - Design System Typography
struct AppFont {
    // Font Sizes
    static let xs: CGFloat = 12 // 0.75rem
    static let sm: CGFloat = 14 // 0.875rem
    static let base: CGFloat = 16 // 1rem
    static let lg: CGFloat = 18 // 1.125rem
    static let xl: CGFloat = 20 // 1.25rem
    static let xl2: CGFloat = 24 // 1.5rem
    static let xl3: CGFloat = 30 // 1.875rem
    
    // Line Heights
    static let xsLineHeight: CGFloat = 1 / 0.75
    static let smLineHeight: CGFloat = 1.25 / 0.875
    static let baseLineHeight: CGFloat = 1.5
    static let lgLineHeight: CGFloat = 1.75 / 1.125
    static let xlLineHeight: CGFloat = 1.75 / 1.25
    static let xl2LineHeight: CGFloat = 2 / 1.5
    static let xl3LineHeight: CGFloat = 1.2
    
    // Font Weights
    static let medium = Font.Weight.medium // 500
    static let semibold = Font.Weight.semibold // 600
    static let bold = Font.Weight.bold // 700
    
    // Letter Spacing
    static let trackingWide: CGFloat = 0.4 // 0.025em * 16
}

// MARK: - Typography Modifiers
extension View {
    
    func textXS(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.xs, weight: weight))
    }
    
    func textSM(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.sm, weight: weight))
    }
    
    func textBase(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.base, weight: weight))
    }
    
    func textLG(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.lg, weight: weight))
    }
    
    func textXL(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.xl, weight: weight))
    }
    
    func text2XL(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.xl2, weight: weight))
    }
    
    func text3XL(weight: Font.Weight = .regular) -> some View {
        self.font(.system(size: AppFont.xl3, weight: weight))
    }
}

extension UIColor {

    convenience init(hex: String) {
        var hexFormatted = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        // Remove the # if it exists
        if hexFormatted.hasPrefix("#") {
            hexFormatted.remove(at: hexFormatted.startIndex)
        }

        var rgbValue: UInt64 = 0
        Scanner(string: hexFormatted).scanHexInt64(&rgbValue)

        if hexFormatted.count == 6 {
            // RGB (no alpha)
            let r = CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0
            let g = CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0
            let b = CGFloat(rgbValue & 0x0000FF) / 255.0
            self.init(red: r, green: g, blue: b, alpha: 1.0)
        } else if hexFormatted.count == 8 {
            // RGBA (with alpha)
            let r = CGFloat((rgbValue & 0xFF000000) >> 24) / 255.0
            let g = CGFloat((rgbValue & 0x00FF0000) >> 16) / 255.0
            let b = CGFloat((rgbValue & 0x0000FF00) >> 8) / 255.0
            let a = CGFloat(rgbValue & 0x000000FF) / 255.0
            self.init(red: r, green: g, blue: b, alpha: a)
        } else {
            // Invalid hex string, return default black color
            self.init(red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
        }
    }
}

public extension Color {

    init(hex: String) {
        self.init(uiColor: UIColor(hex: hex))
    }
}

public extension Color {
    
    var uiColor: UIColor {
        UIColor(self)
    }
}
