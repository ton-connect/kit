//  TONToncenterEmulationResponse.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 13.10.2025.
//

import Foundation

public struct TONToncenterEmulationResponse: Codable {
    public var mcBlockSeqno: Int
    public var trace: TONEmulationTraceNode
    public var transactions: [String: TONToncenterTransaction]
    public var actions: [TONEmulationAction]
    public var codeCells: [String: String]
    public var dataCells: [String: String]
    public var addressBook: [String: TONEmulationAddressBookEntry]
    public var metadata: [String: TONEmulationAddressMetadata]
    public var randSeed: String
    public var isIncomplete: Bool

    enum CodingKeys: String, CodingKey {
        case mcBlockSeqno = "mc_block_seqno"
        case trace
        case transactions
        case actions
        case codeCells = "code_cells"
        case dataCells = "data_cells"
        case addressBook = "address_book"
        case metadata
        case randSeed = "rand_seed"
        case isIncomplete = "is_incomplete"
    }
}

public struct TONEmulationTraceNode: Codable {
    public var txHash: String
    public var inMsgHash: String?
    public var children: [TONEmulationTraceNode]

    enum CodingKeys: String, CodingKey {
        case txHash = "tx_hash"
        case inMsgHash = "in_msg_hash"
        case children
    }
}

public struct TONToncenterTransaction: Codable {
    public var account: String
    public var hash: String
    public var lt: String
    public var now: Int
    public var mcBlockSeqno: Int
    public var traceExternalHash: String
    public var prevTransHash: String?
    public var prevTransLt: String?
    public var origStatus: String
    public var endStatus: String
    public var totalFees: String
    public var totalFeesExtraCurrencies: [String: String]
    public var description: TONEmulationTransactionDescription
    public var blockRef: TONEmulationBlockRef
    public var inMsg: TONEmulationMessage?
    public var outMsgs: [TONEmulationMessage]
    public var accountStateBefore: TONEmulationAccountState
    public var accountStateAfter: TONEmulationAccountState
    public var emulated: Bool
    public var traceId: String?

    enum CodingKeys: String, CodingKey {
        case account
        case hash
        case lt
        case now
        case mcBlockSeqno = "mc_block_seqno"
        case traceExternalHash = "trace_external_hash"
        case prevTransHash = "prev_trans_hash"
        case prevTransLt = "prev_trans_lt"
        case origStatus = "orig_status"
        case endStatus = "end_status"
        case totalFees = "total_fees"
        case totalFeesExtraCurrencies = "total_fees_extra_currencies"
        case description
        case blockRef = "block_ref"
        case inMsg = "in_msg"
        case outMsgs = "out_msgs"
        case accountStateBefore = "account_state_before"
        case accountStateAfter = "account_state_after"
        case emulated
        case traceId = "trace_id"
    }
}

public struct TONEmulationBlockRef: Codable {
    public var workchain: Int
    public var shard: String
    public var seqno: Int
}

public struct TONEmulationTransactionDescription: Codable {
    public var type: String
    public var aborted: Bool
    public var destroyed: Bool
    public var creditFirst: Bool
    public var isTock: Bool
    public var installed: Bool
    public var storagePh: TONEmulationStoragePh
    public var creditPh: TONEmulationCreditPh?
    public var computePh: TONEmulationComputePh
    public var action: TONEmulationActionDescription

    enum CodingKeys: String, CodingKey {
        case type
        case aborted
        case destroyed
        case creditFirst = "credit_first"
        case isTock = "is_tock"
        case installed
        case storagePh = "storage_ph"
        case creditPh = "credit_ph"
        case computePh = "compute_ph"
        case action
    }
}

public struct TONEmulationStoragePh: Codable {
    public var storageFeesCollected: String
    public var statusChange: String

    enum CodingKeys: String, CodingKey {
        case storageFeesCollected = "storage_fees_collected"
        case statusChange = "status_change"
    }
}

public struct TONEmulationCreditPh: Codable {
    public var credit: String
}

public struct TONEmulationComputePh: Codable {
    public var skipped: Bool
    public var success: Bool
    public var msgStateUsed: Bool
    public var accountActivated: Bool
    public var gasFees: String
    public var gasUsed: String
    public var gasLimit: String
    public var gasCredit: String?
    public var mode: Int
    public var exitCode: Int
    public var vmSteps: Int
    public var vmInitStateHash: String
    public var vmFinalStateHash: String

    enum CodingKeys: String, CodingKey {
        case skipped
        case success
        case msgStateUsed = "msg_state_used"
        case accountActivated = "account_activated"
        case gasFees = "gas_fees"
        case gasUsed = "gas_used"
        case gasLimit = "gas_limit"
        case gasCredit = "gas_credit"
        case mode
        case exitCode = "exit_code"
        case vmSteps = "vm_steps"
        case vmInitStateHash = "vm_init_state_hash"
        case vmFinalStateHash = "vm_final_state_hash"
    }
}

public struct TONEmulationActionDescription: Codable {
    public var success: Bool
    public var valid: Bool
    public var noFunds: Bool
    public var statusChange: String
    public var totalFwdFees: String?
    public var totalActionFees: String?
    public var resultCode: Int
    public var totActions: Int
    public var specActions: Int
    public var skippedActions: Int
    public var msgsCreated: Int
    public var actionListHash: String
    public var totMsgSize: TONEmulationMsgSize

    enum CodingKeys: String, CodingKey {
        case success
        case valid
        case noFunds = "no_funds"
        case statusChange = "status_change"
        case totalFwdFees = "total_fwd_fees"
        case totalActionFees = "total_action_fees"
        case resultCode = "result_code"
        case totActions = "tot_actions"
        case specActions = "spec_actions"
        case skippedActions = "skipped_actions"
        case msgsCreated = "msgs_created"
        case actionListHash = "action_list_hash"
        case totMsgSize = "tot_msg_size"
    }
}

public struct TONEmulationMsgSize: Codable {
    public var cells: String
    public var bits: String
}

public struct TONEmulationMessage: Codable {
    public var hash: String
    public var source: String?
    public var destination: String
    public var value: String?
    public var valueExtraCurrencies: [String: String]
    public var fwdFee: String?
    public var ihrFee: String?
    public var createdLt: String?
    public var createdAt: String?
    public var opcode: String?
    public var ihrDisabled: Bool?
    public var bounce: Bool?
    public var bounced: Bool?
    public var importFee: String?
    public var messageContent: TONEmulationMessageContent
    public var initState: String?
    public var hashNorm: String?

    enum CodingKeys: String, CodingKey {
        case hash
        case source
        case destination
        case value
        case valueExtraCurrencies = "value_extra_currencies"
        case fwdFee = "fwd_fee"
        case ihrFee = "ihr_fee"
        case createdLt = "created_lt"
        case createdAt = "created_at"
        case opcode
        case ihrDisabled = "ihr_disabled"
        case bounce
        case bounced
        case importFee = "import_fee"
        case messageContent = "message_content"
        case initState = "init_state"
        case hashNorm = "hash_norm"
    }
}

public struct TONEmulationMessageContent: Codable {
    public var hash: String
    public var body: String
    public var decoded: String?
}

public struct TONEmulationAccountState: Codable {
    public var hash: String
    public var balance: String
    public var extraCurrencies: [String: String]?
    public var accountStatus: String
    public var frozenHash: String?
    public var dataHash: String?
    public var codeHash: String?

    enum CodingKeys: String, CodingKey {
        case hash
        case balance
        case extraCurrencies = "extra_currencies"
        case accountStatus = "account_status"
        case frozenHash = "frozen_hash"
        case dataHash = "data_hash"
        case codeHash = "code_hash"
    }
}

public struct TONEmulationAction: Codable {
    public var traceId: String?
    public var actionId: String
    public var startLt: String
    public var endLt: String
    public var startUtime: Int
    public var endUtime: Int
    public var traceEndLt: String
    public var traceEndUtime: Int
    public var traceMcSeqnoEnd: Int
    public var transactions: [String]
    public var success: Bool
    public var type: String
    public var traceExternalHash: String
    public var accounts: [String]
    public var details: TONEmulationActionDetails

    enum CodingKeys: String, CodingKey {
        case traceId = "trace_id"
        case actionId = "action_id"
        case startLt = "start_lt"
        case endLt = "end_lt"
        case startUtime = "start_utime"
        case endUtime = "end_utime"
        case traceEndLt = "trace_end_lt"
        case traceEndUtime = "trace_end_utime"
        case traceMcSeqnoEnd = "trace_mc_seqno_end"
        case transactions
        case success
        case type
        case traceExternalHash = "trace_external_hash"
        case accounts
        case details
    }
}

public enum TONEmulationActionDetails: Codable {
    case jettonSwap(TONEmulationJettonSwapDetails)
    case callContract(TONEmulationCallContractDetails)
    case unknown([String: String])

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let _ = try? container.decode(String.self, forKey: .dex) {
            let value = try TONEmulationJettonSwapDetails(from: decoder)
            self = .jettonSwap(value)
            return
        }
        if let _ = try? container.decode(String.self, forKey: .opcode) {
            let value = try TONEmulationCallContractDetails(from: decoder)
            self = .callContract(value)
            return
        }
        let value = try [String: String](from: decoder)
        self = .unknown(value)
    }

    public func encode(to encoder: Encoder) throws {
        switch self {
        case .jettonSwap(let value):
            try value.encode(to: encoder)
        case .callContract(let value):
            try value.encode(to: encoder)
        case .unknown(let value):
            try value.encode(to: encoder)
        }
    }

    private enum CodingKeys: String, CodingKey {
        case dex
        case opcode
    }
}

public struct TONEmulationJettonSwapDetails: Codable {
    public var dex: String
    public var sender: String
    public var assetIn: String
    public var assetOut: String
    public var dexIncomingTransfer: TONEmulationJettonTransfer
    public var dexOutgoingTransfer: TONEmulationJettonTransfer
    public var peerSwaps: [String] // unknown[]

    enum CodingKeys: String, CodingKey {
        case dex
        case sender
        case assetIn = "asset_in"
        case assetOut = "asset_out"
        case dexIncomingTransfer = "dex_incoming_transfer"
        case dexOutgoingTransfer = "dex_outgoing_transfer"
        case peerSwaps = "peer_swaps"
    }
}

public struct TONEmulationJettonTransfer: Codable {
    public var asset: String
    public var source: String
    public var destination: String
    public var sourceJettonWallet: String?
    public var destinationJettonWallet: String?
    public var amount: String

    enum CodingKeys: String, CodingKey {
        case asset
        case source
        case destination
        case sourceJettonWallet = "source_jetton_wallet"
        case destinationJettonWallet = "destination_jetton_wallet"
        case amount
    }
}

public struct TONEmulationCallContractDetails: Codable {
    public var opcode: String
    public var source: String
    public var destination: String
    public var value: String
    public var extraCurrencies: [String: String]?

    enum CodingKeys: String, CodingKey {
        case opcode
        case source
        case destination
        case value
        case extraCurrencies = "extra_currencies"
    }
}

public struct TONEmulationAddressBookEntry: Codable {
    public var userFriendly: String
    public var domain: String?

    enum CodingKeys: String, CodingKey {
        case userFriendly = "user_friendly"
        case domain
    }
}

public struct TONEmulationAddressMetadata: Codable {
    public var isIndexed: Bool
    public var tokenInfo: [TONEmulationTokenInfo]?

    enum CodingKeys: String, CodingKey {
        case isIndexed = "is_indexed"
        case tokenInfo = "token_info"
    }
}

public struct TONEmulationTokenInfo: Codable {
    public var valid: Bool
    public var type: String
    public var extra: TONEmulationTokenInfoExtra?
}

public struct TONEmulationTokenInfoExtra: Codable {
    public var balance: String?
    public var jetton: String?
    public var owner: String?
    public var name: String?
    public var symbol: String?
    public var description: String?
    public var image: String?
    public var decimals: String?
    public var uri: String?
    public var websites: [String]?
}
