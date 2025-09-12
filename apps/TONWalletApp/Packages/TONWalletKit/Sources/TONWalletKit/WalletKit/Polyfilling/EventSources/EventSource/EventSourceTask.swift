import Foundation

@EventSourceActor
final class EventSourceTask {
    enum TaskEvent: Sendable {
        case open
        case closed
        case event(Event)
        case error(Error)
    }
    
    enum TaskState {
        case idle
        case connecting
        case open
        case closed
    }
    
    private var state: TaskState = .idle
    private var httpResponseErrorStatusCode: Int?
    private var cancelClosure: (() -> Void)?
    
    private var eventParser = EventParser()
    
    private let urlRequest: URLRequest
    private let timeout: TimeInterval
    private var lastEventId: String?
    
    init(urlRequest: URLRequest,
         timeout: TimeInterval,
         lastEventId: String?) {
        self.urlRequest = urlRequest
        self.timeout = timeout
        self.lastEventId = lastEventId
    }
    
    func eventsStream() -> AsyncStream<TaskEvent> {
        guard state == .idle else {
            return AsyncStream { continuation in
                continuation.yield(.error(EventSourceError.taskAlreadyInUse))
                continuation.finish()
            }
        }
        
        return AsyncStream { [weak self] continuation in
            guard let self else { return }
            
            let urlSessionDelegate = URLSessionDelegate()
            
            let urlSession = URLSession(
                configuration: createURLSessionConfiguration(),
                delegate: urlSessionDelegate,
                delegateQueue: nil
            )
            
            let urlSessionDataTask = urlSession.dataTask(with: urlRequest)
            
            let urlSessionDelegateTask = Task { [weak self] in
                guard let self else { return }
                for await event in urlSessionDelegate.eventStream.stream {
                    switch event {
                    case let .didComplete(error):
                        handleDidComplete(error: error,
                                          streamContinuation: continuation)
                    case let .didReceiveData(data):
                        handleDidReceiveData(
                            data: data,
                            streamContinuation: continuation
                        )
                    case let .didReceiveResponse(response, completionHandler):
                        handleDidReceiveResponse(
                            response: response,
                            urlSessionDelegateCompletionHandler: completionHandler,
                            streamContinuation: continuation
                        )
                    }
                }
            }
            
            continuation.onTermination = { [weak self] _ in
                urlSessionDelegateTask.cancel()
                Task { [weak self] in await self?.closeConnection(streamContinuation: continuation) }
            }
            
            state = .connecting
            urlSessionDataTask.resume()
            
            cancelClosure = { [weak self] in
                self?.state = .closed
                urlSessionDataTask.cancel()
                urlSession.invalidateAndCancel()
            }
        }
    }
    
    public func cancel() {
        cancelClosure?()
    }
    
    private func createURLSessionConfiguration() -> URLSessionConfiguration {
        let configuration = URLSessionConfiguration.default
        configuration.httpAdditionalHeaders = [
            "Accept": "text/event-stream"
        ]
        if let lastEventId {
            configuration.httpAdditionalHeaders?["Last-Event-ID"] = lastEventId
        }
        configuration.timeoutIntervalForRequest = timeout
        configuration.timeoutIntervalForResource = timeout
        return configuration
    }
    
    private func handleDidReceiveResponse(response: URLResponse,
                                          urlSessionDelegateCompletionHandler: @escaping (URLSession.ResponseDisposition) -> Void,
                                          streamContinuation: AsyncStream<TaskEvent>.Continuation) {
        guard state == .connecting else {
            urlSessionDelegateCompletionHandler(.cancel)
            return
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            urlSessionDelegateCompletionHandler(.cancel)
            return
        }
        
        if (200..<300).contains(httpResponse.statusCode) {
            state = .open
            streamContinuation.yield(.open)
        } else {
            httpResponseErrorStatusCode = httpResponse.statusCode
        }
        urlSessionDelegateCompletionHandler(.allow)
    }
    
    private func handleDidReceiveData(data: Data,
                                      streamContinuation: AsyncStream<TaskEvent>.Continuation) {
        if let httpResponseErrorStatusCode {
            handleDidComplete(
                error:
                    EventSourceError.connectionError(
                        responseStatusCode: httpResponseErrorStatusCode,
                        responseData: data),
                streamContinuation: streamContinuation
            )
            return
        }
        let events = eventParser.parse(data).filter { !$0.isHeartbeat }
        if let lastEventId = events.last(where: { $0.id != nil })?.id {
            self.lastEventId = lastEventId
        }
        events.forEach { streamContinuation.yield(.event($0)) }
    }
    
    private func handleDidComplete(error: Error?,
                                   streamContinuation: AsyncStream<TaskEvent>.Continuation) {
        if state != .closed, let error {
            streamContinuation.yield(.error(error))
        }
        closeConnection(streamContinuation: streamContinuation)
    }
    
    private func closeConnection(streamContinuation: AsyncStream<TaskEvent>.Continuation) {
        if state != .closed {
            streamContinuation.yield(.closed)
            streamContinuation.finish()
        }
        cancel()
    }
}
