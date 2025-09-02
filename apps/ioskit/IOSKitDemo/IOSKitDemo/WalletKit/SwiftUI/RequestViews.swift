//
//  RequestViews.swift
//  Request handling views for WalletKit
//

import SwiftUI

// MARK: - Connect Request View

struct ConnectRequestView: View {
    let request: ConnectRequestEvent
    let walletKit: TonWalletKitSwift
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedWallet: WalletInfo?
    @State private var isProcessing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // dApp Info
                    dappInfoSection
                    
                    // Permissions
                    permissionsSection
                    
                    // Wallet Selection
                    walletSelectionSection
                    
                    // Actions
                    actionsSection
                }
                .padding()
            }
            .navigationTitle("Connection Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        rejectRequest()
                    }
                    .disabled(isProcessing)
                }
            }
        }
    }
    
    private var dappInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("dApp Information")
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(spacing: 16) {
                // dApp icon placeholder
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 60, height: 60)
                    .overlay {
                        if let iconUrl = request.dAppIconUrl, !iconUrl.isEmpty {
                            // In a real implementation, use AsyncImage
                            Image(systemName: "globe")
                                .foregroundColor(.gray)
                        } else {
                            Image(systemName: "app.fill")
                                .foregroundColor(.gray)
                        }
                    }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(request.dAppName)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text(formatURL(request.dAppUrl))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var permissionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Requested Permissions")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                ForEach(request.permissions) { permission in
                    PermissionRow(permission: permission)
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var walletSelectionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Select Wallet")
                .font(.headline)
                .fontWeight(.semibold)
            
            if walletKit.wallets.isEmpty {
                Text("No wallets available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(spacing: 8) {
                    ForEach(walletKit.wallets) { wallet in
                        WalletSelectionRow(
                            wallet: wallet,
                            isSelected: selectedWallet?.id == wallet.id
                        ) {
                            selectedWallet = wallet
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button(action: approveRequest) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("Connect")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(selectedWallet != nil ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(selectedWallet != nil ? .white : .gray)
                .cornerRadius(12)
            }
            .disabled(selectedWallet == nil || isProcessing)
            
            Button("Reject", action: rejectRequest)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red.opacity(0.1))
                .foregroundColor(.red)
                .cornerRadius(12)
                .disabled(isProcessing)
        }
    }
    
    private func formatURL(_ url: String) -> String {
        guard let urlComponents = URLComponents(string: url) else { return url }
        return urlComponents.host ?? url
    }
    
    private func approveRequest() {
        guard let wallet = selectedWallet else { return }
        
        isProcessing = true
        Task {
            do {
                try await walletKit.approveConnectRequest(request, wallet: wallet)
                dismiss()
            } catch {
                print("Failed to approve connect request: \(error)")
            }
            isProcessing = false
        }
    }
    
    private func rejectRequest() {
        isProcessing = true
        Task {
            do {
                try await walletKit.rejectConnectRequest(request, reason: "User rejected")
                dismiss()
            } catch {
                print("Failed to reject connect request: \(error)")
            }
            isProcessing = false
        }
    }
}

// MARK: - Transaction Request View

struct TransactionRequestView: View {
    let request: TransactionRequestEvent
    let walletKit: TonWalletKitSwift
    
    @Environment(\.dismiss) private var dismiss
    @State private var isProcessing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Transaction Summary
                    transactionSummarySection
                    
                    // Transaction Details
                    transactionDetailsSection
                    
                    // Messages
                    messagesSection
                    
                    // Actions
                    actionsSection
                }
                .padding()
            }
            .navigationTitle("Transaction Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        rejectRequest()
                    }
                    .disabled(isProcessing)
                }
            }
        }
    }
    
    private var transactionSummarySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Transaction Summary")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                SummaryRow(title: "Total Amount", value: "\(formatTON(request.preview.totalAmount)) TON")
                
                if let fees = request.preview.totalFees {
                    SummaryRow(title: "Network Fees", value: "\(formatTON(fees)) TON")
                }
                
                if let recipient = request.preview.recipient {
                    SummaryRow(title: "Recipient", value: formatAddress(recipient))
                }
                
                if let description = request.preview.description {
                    SummaryRow(title: "Description", value: description)
                }
                
                RiskLevelIndicator(level: request.preview.riskLevel)
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var transactionDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Transaction Details")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                DetailRow(title: "From", value: formatAddress(request.walletAddress))
                DetailRow(title: "dApp", value: request.dAppName)
                DetailRow(title: "Valid Until", value: formatTimestamp(request.validUntil))
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var messagesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Messages (\(request.messages.count))")
                .font(.headline)
                .fontWeight(.semibold)
            
            ForEach(Array(request.messages.enumerated()), id: \.offset) { index, message in
                MessageCard(message: message, index: index + 1)
            }
        }
    }
    
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button(action: approveRequest) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("Sign Transaction")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isProcessing)
            
            Button("Reject", action: rejectRequest)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red.opacity(0.1))
                .foregroundColor(.red)
                .cornerRadius(12)
                .disabled(isProcessing)
        }
    }
    
    private func formatTON(_ amount: String) -> String {
        guard let amountValue = Double(amount) else { return amount }
        let tonAmount = amountValue / 1_000_000_000
        return String(format: "%.4f", tonAmount)
    }
    
    private func formatAddress(_ address: String) -> String {
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
    
    private func formatTimestamp(_ timestamp: TimeInterval) -> String {
        let date = Date(timeIntervalSince1970: timestamp)
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func approveRequest() {
        isProcessing = true
        Task {
            do {
                _ = try await walletKit.approveTransactionRequest(request)
                dismiss()
            } catch {
                print("Failed to approve transaction request: \(error)")
            }
            isProcessing = false
        }
    }
    
    private func rejectRequest() {
        isProcessing = true
        Task {
            do {
                try await walletKit.rejectTransactionRequest(request, reason: "User rejected")
                dismiss()
            } catch {
                print("Failed to reject transaction request: \(error)")
            }
            isProcessing = false
        }
    }
}

// MARK: - Sign Data Request View

struct SignDataRequestView: View {
    let request: SignDataRequestEvent
    let walletKit: TonWalletKitSwift
    
    @Environment(\.dismiss) private var dismiss
    @State private var isProcessing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Request Info
                    requestInfoSection
                    
                    // Data Preview
                    dataPreviewSection
                    
                    // Actions
                    actionsSection
                }
                .padding()
            }
            .navigationTitle("Sign Data Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        rejectRequest()
                    }
                    .disabled(isProcessing)
                }
            }
        }
    }
    
    private var requestInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Request Information")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                DetailRow(title: "dApp", value: request.dAppName)
                DetailRow(title: "Wallet", value: formatAddress(request.walletAddress))
                
                if let domain = request.data.domain {
                    DetailRow(title: "Domain", value: domain)
                }
                
                DetailRow(title: "Timestamp", value: formatTimestamp(request.data.timestamp))
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var dataPreviewSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Data to Sign")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Type")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(request.preview.type.rawValue.capitalized)
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                }
                
                ScrollView {
                    Text(request.preview.content)
                        .font(.system(.footnote, design: .monospaced))
                        .foregroundColor(.primary)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }
                .frame(maxHeight: 200)
                
                if let schema = request.preview.schema {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Schema")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(schema)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.primary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button(action: approveRequest) {
                HStack {
                    if isProcessing {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("Sign Data")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isProcessing)
            
            Button("Reject", action: rejectRequest)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red.opacity(0.1))
                .foregroundColor(.red)
                .cornerRadius(12)
                .disabled(isProcessing)
        }
    }
    
    private func formatAddress(_ address: String) -> String {
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
    
    private func formatTimestamp(_ timestamp: TimeInterval) -> String {
        let date = Date(timeIntervalSince1970: timestamp)
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func approveRequest() {
        isProcessing = true
        Task {
            do {
                _ = try await walletKit.approveSignDataRequest(request)
                dismiss()
            } catch {
                print("Failed to approve sign data request: \(error)")
            }
            isProcessing = false
        }
    }
    
    private func rejectRequest() {
        isProcessing = true
        Task {
            do {
                try await walletKit.rejectSignDataRequest(request, reason: "User rejected")
                dismiss()
            } catch {
                print("Failed to reject sign data request: \(error)")
            }
            isProcessing = false
        }
    }
}

// MARK: - Supporting Views

struct PermissionRow: View {
    let permission: ConnectPermission
    
    var body: some View {
        HStack {
            Image(systemName: iconForPermission(permission.name))
                .foregroundColor(.blue)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(permission.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(permission.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
        }
        .padding(.vertical, 4)
    }
    
    private func iconForPermission(_ name: String) -> String {
        switch name {
        case "ton_addr":
            return "person.circle"
        case "ton_proof":
            return "signature"
        default:
            return "checkmark.circle"
        }
    }
}

struct WalletSelectionRow: View {
    let wallet: WalletInfo
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(wallet.walletName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text(formatAddress(wallet.address))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                } else {
                    Circle()
                        .stroke(Color.gray, lineWidth: 1)
                        .frame(width: 20, height: 20)
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatAddress(_ address: String) -> String {
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
}

struct SummaryRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

struct DetailRow: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Text(value)
                .font(.footnote)
                .foregroundColor(.primary)
        }
    }
}

struct RiskLevelIndicator: View {
    let level: RiskLevel
    
    var body: some View {
        HStack {
            Text("Risk Level")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(level.rawValue.capitalized)
                .font(.subheadline)
                .fontWeight(.medium)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(colorForRiskLevel(level).opacity(0.2))
                .foregroundColor(colorForRiskLevel(level))
                .cornerRadius(4)
        }
    }
    
    private func colorForRiskLevel(_ level: RiskLevel) -> Color {
        switch level {
        case .low:
            return .green
        case .medium:
            return .orange
        case .high, .critical:
            return .red
        }
    }
}

struct MessageCard: View {
    let message: TransactionMessage
    let index: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Message \(index)")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            
            VStack(spacing: 8) {
                DetailRow(title: "To", value: formatAddress(message.to))
                DetailRow(title: "Amount", value: "\(formatTON(message.amount)) TON")
                
                if let payload = message.payload, !payload.isEmpty {
                    DetailRow(title: "Payload", value: payload)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(.separator), lineWidth: 0.5)
        )
    }
    
    private func formatAddress(_ address: String) -> String {
        if address.count > 12 {
            return "\(address.prefix(6))...\(address.suffix(6))"
        }
        return address
    }
    
    private func formatTON(_ amount: String) -> String {
        guard let amountValue = Double(amount) else { return amount }
        let tonAmount = amountValue / 1_000_000_000
        return String(format: "%.4f", tonAmount)
    }
}
