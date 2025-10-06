import Foundation

final class URLSessionDelegate: NSObject, URLSessionDataDelegate {
    enum Event: Sendable {
        case didReceiveResponse(URLResponse, completionHandler: @Sendable (URLSession.ResponseDisposition) -> Void)
        case didComplete(error: Error?)
        case didReceiveData(Data)
    }
    
    let eventStream = AsyncStream<Event>.makeStream()
    
    func urlSession(_ session: URLSession,
                    dataTask: URLSessionDataTask,
                    didReceive response: URLResponse,
                    completionHandler: @Sendable @escaping (URLSession.ResponseDisposition) -> Void) {
        eventStream.continuation.yield(
            .didReceiveResponse(response, completionHandler: completionHandler)
        )
    }
    
    func urlSession(_ session: URLSession,
                    task: URLSessionTask,
                    didCompleteWithError error: Error?) {
        eventStream.continuation.yield(
            .didComplete(error: error)
        )
    }
    
    func urlSession(_ session: URLSession,
                    dataTask: URLSessionDataTask,
                    didReceive data: Data) {
        eventStream.continuation.yield(
            .didReceiveData(data)
        )
    }
}
