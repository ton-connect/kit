import Foundation

enum EventSourceError: Swift.Error {
    case taskAlreadyInUse
    case connectionError(responseStatusCode: Int, responseData: Data)
    case timeout
}
