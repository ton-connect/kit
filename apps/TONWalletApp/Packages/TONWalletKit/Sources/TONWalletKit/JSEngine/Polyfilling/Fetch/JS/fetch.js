async function fetch(urlOrRequest, requestInit) {
    const request = urlOrRequest instanceof Request ? urlOrRequest : new Request(urlOrRequest, requestInit);

    request.signal?.throwIfAborted();

    const task = _jsCoreExtrasFetchTask({
        url: request.url,
        method: request.method,
        headers: request.headers,
        includeCookies: request.credentials === 'include',
        body: await request.bytes(),
    });

    request.signal?.throwIfAborted();

    const abortListener = (e) => {
        task.cancel(e.target.reason ?? new DOMException('signal is aborted without reason', 'AbortError'));
    };

    let response;
    try {
        request.signal?.addEventListener('abort', abortListener);
        response = await task.perform();
    } finally {
        request.signal?.removeEventListener('abort', abortListener);
    }
    return response;
}
