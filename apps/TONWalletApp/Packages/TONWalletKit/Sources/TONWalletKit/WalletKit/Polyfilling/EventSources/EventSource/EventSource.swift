import Foundation

@globalActor actor EventSourceActor: GlobalActor {
    static let shared = EventSourceActor()
}

struct EventSource {
    private let timeout: TimeInterval
    
    init(timeout: TimeInterval = 300) {
        self.timeout = timeout
    }
    
    @EventSourceActor
    func createTask(urlRequest: URLRequest,
                    lastEventId: String? = nil) -> EventSourceTask {
        EventSourceTask(
            urlRequest: urlRequest,
            timeout: timeout,
            lastEventId: lastEventId
        )
    }
}
