import Foundation

struct Event: Sendable {
    var event: String?
    var id: String?
    var data: String?
    
    init(event: String? = nil,
                id: String? = nil,
                data: String? = nil) {
        self.event = event
        self.id = id
        self.data = data
    }
    
    var isHeartbeat: Bool {
        event == "heartbeat"
    }
    
    var isEmpty: Bool {
        if let id, !id.isEmpty { return false }
        if let event, !event.isEmpty { return false }
        if let data, !data.isEmpty { return false }
        return true
    }
}
