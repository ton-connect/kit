//
//  SessionCard.swift
//  Session display card component
//

import SwiftUI

struct SessionCard: View {
    let session: SessionInfo
    let walletKit: TonWalletKitSwift
    
    @State private var showingDisconnectConfirmation = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(session.dAppName)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    
                    if let url = session.dAppUrl {
                        Text(formatURL(url))
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                Button("Disconnect") {
                    showingDisconnectConfirmation = true
                }
                .font(.caption)
                .foregroundColor(.red)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.red.opacity(0.1))
                .cornerRadius(6)
            }
            
            Divider()
            
            // Connection details
            VStack(alignment: .leading, spacing: 8) {
                                    SessionInfoRow(
                    icon: "person.circle",
                    title: "Wallet",
                    value: formattedWalletAddress
                )
                
                                    SessionInfoRow(
                    icon: "clock",
                    title: "Connected",
                    value: formatDate(session.createdAt)
                )
                
                                    SessionInfoRow(
                    icon: "arrow.clockwise.circle",
                    title: "Last Activity",
                    value: formatDate(session.lastActivity)
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1, x: 0, y: 1)
        .alert("Disconnect Session", isPresented: $showingDisconnectConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Disconnect", role: .destructive) {
                disconnectSession()
            }
        } message: {
            Text("Are you sure you want to disconnect from '\(session.dAppName)'?")
        }
    }
    
    private var formattedWalletAddress: String {
        let address = session.walletAddress
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
    
    private func formatURL(_ url: String) -> String {
        guard let urlComponents = URLComponents(string: url) else { return url }
        return urlComponents.host ?? url
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
    
    private func disconnectSession() {
        Task {
            do {
                try await walletKit.disconnect(sessionId: session.sessionId)
            } catch {
                print("Failed to disconnect session: \(error)")
            }
        }
    }
}

struct SessionInfoRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 16)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

struct SessionCard_Previews: PreviewProvider {
    static var previews: some View {
        let session = SessionInfo(
            sessionId: "session123",
            dAppName: "Demo DApp",
            walletAddress: "EQD_V9j8p5rQNPx0eK9-2j7J4WROUbm1tFNVzVlzCq-wgmKk",
            dAppUrl: "https://demo.tonconnect.org"
        )
        
        SessionCard(
            session: session,
            walletKit: TonWalletKitSwift(config: WalletKitConfig(manifestUrl: ""))
        )
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
