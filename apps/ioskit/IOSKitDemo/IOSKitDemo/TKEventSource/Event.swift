import Foundation

public struct Event: Sendable {
  public internal(set) var event: String?
  public internal(set) var id: String?
  public internal(set) var data: String?
  
  public init(event: String? = nil,
              id: String? = nil,
              data: String? = nil) {
    self.event = event
    self.id = id
    self.data = data
  }
  
  public var isHeartbeat: Bool {
    event == "heartbeat"
  }
  
  public var isEmpty: Bool {
    if let id, !id.isEmpty { return false }
    if let event, !event.isEmpty { return false }
    if let data, !data.isEmpty { return false }
    return true
  }
}
