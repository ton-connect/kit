import Foundation

@globalActor public actor EventSourceActor: GlobalActor {
  public static let shared = EventSourceActor()
}

public struct EventSource {
  private let timeout: TimeInterval
  
  public init(timeout: TimeInterval = 300) {
    self.timeout = timeout
  }
  
  @EventSourceActor
  public func createTask(urlRequest: URLRequest,
                         lastEventId: String? = nil) -> EventSourceTask {
    EventSourceTask(
      urlRequest: urlRequest,
      timeout: timeout,
      lastEventId: lastEventId
    )
  }
}
