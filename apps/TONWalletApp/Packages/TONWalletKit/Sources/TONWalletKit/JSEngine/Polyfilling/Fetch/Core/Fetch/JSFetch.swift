@preconcurrency import JavaScriptCore

// MARK: - JSFetch

public struct JSFetchInstaller: Sendable, JSContextInstallable {
    let session: URLSession
    
    public func install(in context: JSContext) throws {
        try context.install([
            .request,
            .response,
            .jsCoreExtrasBundled(path: "fetch.js")
        ])
        let constructFetchTask: @convention(block) (JSValue) -> JSFetchTask? = { request in
            self.constructFetchTask(request: request)
        }
        context.setObject(constructFetchTask, forPath: "_jsCoreExtrasFetchTask")
    }
    
    private func constructFetchTask(request: JSValue) -> JSFetchTask? {
        let context = JSContext.current()!
        let path = request.objectForKeyedSubscript("url").toString() ?? ""
        guard let url = URL(string: path) else {
            context.exception = .typeError(message: "Failed to parse URL from \(path).", in: context)
            return nil
        }
        guard url.hasHTTPScheme else {
            context.exception = .typeError(
                message:
                    "Cannot load from \(url). URL scheme \"\(url.scheme ?? "unknown")\" is not supported.",
                in: context
            )
            return nil
        }
        return JSFetchTask(
            request: URLRequest(
                url: url,
                request: request,
                cookieStorage: self.session.configuration.httpCookieStorage
            ),
            session: self.session
        )
    }
}

extension JSContextInstallable where Self == JSFetchInstaller {
    /// An installable that installs a fetch implementation.
    public static var fetch: Self { .fetch(sessionConfiguration: .default) }
    
    /// An installable that installs a fetch implementation.
    ///
    /// - Parameters:
    ///   - sessionConfiguration: The configuration to use for the underlying `URLSession` that makes HTTP requests.
    /// - Returns: An installable.
    public static func fetch(sessionConfiguration: URLSessionConfiguration) -> Self {
        JSFetchInstaller(
            session: URLSession(
                configuration: sessionConfiguration,
                delegate: JSURLSessionDataDelegate(isShared: true),
                delegateQueue: nil
            )
        )
    }
    
    /// An installable that installs a fetch implementation.
    ///
    /// - Parameters:
    ///   - session: The underlying `URLSession` to use to make HTTP requests.
    /// - Returns: An installable.
    @available(iOS 15, macOS 12, tvOS 15, watchOS 8, *)
    public static func fetch(session: URLSession) -> Self {
        JSFetchInstaller(session: session)
    }
}

// MARK: - Fetch Task

@objc private protocol JSFetchTaskExport: JSExport {
    func perform() -> JSValue
    func cancel(_ reason: JSValue)
}

@objc private final class JSFetchTask: NSObject, Sendable {
    private let request: URLRequest
    private let session: URLSession
    private let state: Lock<(task: URLSessionDataTask?, delegate: JSURLSessionDataDelegate)>
    
    init(request: URLRequest, session: URLSession) {
        debugPrint(request)
        
        if let body = request.httpBody {
            debugPrint("Body")
            debugPrint(String(data: body, encoding: .utf8) as? AnyObject)
        }
        
        self.request = request
        self.session = session
        if let delegate = session.delegate as? JSURLSessionDataDelegate {
            self.state = Lock((nil, delegate))
        } else {
            self.state = Lock((nil, JSURLSessionDataDelegate(isShared: false)))
        }
    }
}

extension JSFetchTask: JSFetchTaskExport {
    func perform() -> JSValue {
        JSPromise(in: .current()) { continuation in
            self.state.withLock { state in
                let task = state.task ?? self.session.dataTask(with: self.request)
                state.task = task
                state.delegate.addFetchContinuation(continuation, for: task.taskIdentifier)
                guard !state.delegate.rejectIfCancelled(for: task.taskIdentifier) else { return }
                if #available(iOS 15, macOS 12, tvOS 15, watchOS 8, *), !state.delegate.isShared {
                    task.delegate = state.delegate
                }
                task.resume()
            }
        }
        .value
    }
    
    func cancel(_ reason: JSValue) {
        let transfer = UnsafeJSValueTransfer(value: reason)
        self.state.withLock { state in
            let task = state.task ?? self.session.dataTask(with: self.request)
            state.delegate.markCancelReason(reason: transfer, for: task.taskIdentifier)
            task.cancel()
        }
    }
}

// MARK: - Delegate

private final class JSURLSessionDataDelegate: NSObject {
    typealias TaskID = Int
    private typealias State = (
        body: JSFetchResponseBlobStorage?,
        cancelReason: JSValue?,
        didRedirect: Bool,
        continuation: JSPromise.Continuation?
    )
    
    let isShared: Bool
    private let state = Lock([TaskID: State]())
    
    init(isShared: Bool) {
        self.isShared = isShared
    }
}

extension JSURLSessionDataDelegate {
    func addFetchContinuation(_ continuation: JSPromise.Continuation, for taskId: TaskID) {
        self.editState(for: taskId) { $0.continuation = continuation }
    }
    
    func markCancelReason(reason: UnsafeJSValueTransfer, for taskId: TaskID) {
        self.editState(for: taskId) { $0.cancelReason = reason.value }
    }
    
    func rejectIfCancelled(for taskId: TaskID) -> Bool {
        self.editState(for: taskId) { state in
            if let cancelReason = state.cancelReason {
                state.continuation?.resume(rejecting: cancelReason)
                return true
            }
            return false
        }
    }
}

extension JSURLSessionDataDelegate: URLSessionDataDelegate {
    func urlSession(
        _ session: URLSession,
        dataTask: URLSessionDataTask,
        didReceive response: URLResponse,
        completionHandler: @escaping @Sendable (URLSession.ResponseDisposition) -> Void
    ) {
        debugPrint(response)
        self.editState(for: dataTask.taskIdentifier) { state in
            guard let continuation = state.continuation else { return }
            guard let response = response as? HTTPURLResponse else {
                continuation.resume(
                    rejecting: JSValue(
                        newErrorFromMessage: "Server responded with a non-HTTP response.",
                        in: continuation.context
                    )
                )
                return
            }
            let storage = JSFetchResponseBlobStorage(contentLength: response.expectedContentLength)
            let (cookies, headers) = response.cookieFilteredHeaders
            if dataTask.currentRequest?.httpShouldHandleCookies == true {
                session.configuration.httpCookieStorage?
                    .setCookies(cookies, for: response.url, mainDocumentURL: response.url)
            }
            continuation.resume(
                resolving: JSValue.response(
                    response: response,
                    headers: headers,
                    body: storage,
                    didRedirect: state.didRedirect,
                    in: continuation.context
                )
            )
            state.body = storage
        }
        completionHandler(.allow)
    }
    
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping @Sendable (URLRequest?) -> Void
    ) {
        self.editState(for: task.taskIdentifier) { $0.didRedirect = true }
        completionHandler(request)
    }
    
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        debugPrint("Response object")
        debugPrint(String(data: data, encoding: .utf8) as? AnyObject)
        self.editState(for: dataTask.taskIdentifier) { $0.body?.resume(with: data) }
    }
    
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: (any Error)?
    ) {
        self.editState(for: task.taskIdentifier) { state in
            state.body?.finish(with: error)
            guard let continuation = state.continuation, let error else { return }
            if let error = error as? URLError, error.code == .cancelled {
                continuation.resume(rejecting: state.cancelReason)
            } else {
                continuation.resume(
                    rejecting: JSValue(
                        newErrorFromMessage: error.localizedDescription,
                        in: continuation.context
                    )
                )
            }
        }
    }
}

extension JSURLSessionDataDelegate {
    private func editState<T: Sendable>(
        for taskId: TaskID,
        operation: @Sendable (inout State) -> T
    ) -> T {
        self.state.withLock { operation(&$0[taskId, default: (nil, nil, false, nil)]) }
    }
}

// MARK: - Response Blob Storage

private final class JSFetchResponseBlobStorage {
    private let stream: AsyncThrowingStream<Data, any Error>
    private let continuation: AsyncThrowingStream<Data, any Error>.Continuation
    let utf8SizeInBytes: Int64
    
    init(contentLength: Int64) {
        let (stream, continuation) = AsyncThrowingStream<Data, any Error>.makeStream()
        self.utf8SizeInBytes = contentLength
        self.stream = stream
        self.continuation = continuation
    }
}

extension JSFetchResponseBlobStorage: JSBlobStorage {
    func utf8Bytes(
        startIndex: Int64,
        endIndex: Int64,
        context: JSContext
    ) async throws(JSValueError) -> String.UTF8View {
        do {
            let utf8 = try await self.stream.reduce(into: Data()) { $0.append($1) }
            return String(decoding: utf8, as: UTF8.self)
                .utf8Bytes(startIndex: startIndex, endIndex: endIndex, context: context)
        } catch {
            throw JSValueError(
                value: JSValue(newErrorFromMessage: error.localizedDescription, in: context)
            )
        }
    }
}

extension JSFetchResponseBlobStorage {
    func resume(with data: Data) {
        self.continuation.yield(data)
    }
    
    func finish(with error: (any Error)?) {
        self.continuation.finish(throwing: error)
    }
}

// MARK: - Request

extension URLRequest {
    fileprivate init(url: URL, request: JSValue, cookieStorage: HTTPCookieStorage?) {
        self.init(url: url)
        var requestCopy = self
        requestCopy.httpShouldHandleCookies = request.objectForKeyedSubscript("includeCookies")
            .toBool()
        requestCopy.httpMethod = request.objectForKeyedSubscript("method").toString()
        requestCopy.httpBody = (request.objectForKeyedSubscript("body").toArray() as? [UInt8])
            .map { Data($0) }
        if let cookies = cookieStorage?.cookies(for: url), requestCopy.httpShouldHandleCookies {
            requestCopy.allHTTPHeaderFields = HTTPCookie.requestHeaderFields(with: cookies)
        }
        // Properly map JS Headers object to Swift headers
        if let headers = request.objectForKeyedSubscript("headers"), !headers.isUndefined {
            if let entries = headers.invokeMethod("entries", withArguments: []), entries.isObject {
                // entries() returns an iterator, so we need to iterate manually
                while let next = entries.invokeMethod("next", withArguments: []), 
                      let done = next.objectForKeyedSubscript("done")?.toBool(), 
                      !done 
                {
                    if let pair = next.objectForKeyedSubscript("value"), 
                       let key = pair.atIndex(0), 
                       let value = pair.atIndex(1) 
                    {
                        requestCopy.addValue(value.toString(), forHTTPHeaderField: key.toString())
                    }
                }
            }
        }
        self = requestCopy
    }
}

// MARK: - Status Code

private let statusCodeMessages = [200: "ok"]

extension HTTPURLResponse {
    fileprivate var localizedStatusText: String {
        if let message = statusCodeMessages[self.statusCode] {
            return message
        }
        return HTTPURLResponse.localizedString(forStatusCode: self.statusCode)
    }
}

// MARK: - Cookie Filtering

extension HTTPURLResponse {
    fileprivate var cookieFilteredHeaders: ([HTTPCookie], [AnyHashable: Any]) {
        var headers = self.allHeaderFields
        var cookies = [HTTPCookie]()
        for (key, value) in self.allHeaderFields {
            guard let strKey = key.base as? String, let value = value as? String,
                  let url = self.url
            else { continue }
            guard
                let cookie =
                    HTTPCookie.cookies(withResponseHeaderFields: [strKey: value], for: url)
                    .first
            else { continue }
            cookies.append(cookie)
            if cookie.isHTTPOnly {
                headers.removeValue(forKey: key)
            }
        }
        return (cookies, headers)
    }
}

// MARK: - Response

extension JSValue {
    fileprivate static func response(
        response: HTTPURLResponse,
        headers: [AnyHashable: Any],
        body: some JSBlobStorage,
        didRedirect: Bool,
        in context: JSContext
    ) -> JSValue? {
        let responseInit = JSValue(newObjectIn: context)!
        responseInit.setValue(response.statusCode, forPath: "status")
        responseInit.setValue(response.localizedStatusText, forPath: "statusText")
        responseInit.setValue(headers, forPath: "headers")
        let response = context.objectForKeyedSubscript("Response")
            .construct(withArguments: [
                JSBlob(storage: body, type: response.mimeType.map { MIMEType(rawValue: $0) } ?? .empty),
                responseInit
            ])
        let privateSymbol = context.evaluateScript("Symbol._jsCoreExtrasPrivate")
        response?.objectForKeyedSubscript(privateSymbol)
            .setValue(didRedirect, forPath: "options.redirected")
        return response
    }
}
