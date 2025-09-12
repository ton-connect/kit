//
//  JSEventSourcePolyfill.swift
//  TONWalletKit
//
//  Created by Nikita Rodionov on 11.09.2025.
//

import Foundation
import JavaScriptCore

public class JSEventSourcePolyfill: JSPolyfill {
    private var eventSources: [String: EventSourceTask] = [:]
    private var eventSourceCallbacks: [String: JSValue] = [:]
    
    deinit {
        for (eventSourceId, task) in eventSources {
            Task { @EventSourceActor in
                task.cancel()
            }
            print("🔌 Closed EventSource: \(eventSourceId)")
        }
        eventSources.removeAll()
        eventSourceCallbacks.removeAll()
    }
    
    public func apply(to context: JSContext) {
        let eventSourceCreate: @convention(block) (
            String,
            String,
            JSValue?
        ) -> String = { [weak context] url, eventSourceId, options in
            guard let context else {
                return "failure"
            }
            
            Task {
                await self.createEventSource(
                    in: context,
                    url: url,
                    eventSourceID: eventSourceId,
                    options: options
                )
            }
            return "success"
        }
        
        let eventSourceClose: @convention(block) (String) -> Void = { eventSourceId in
            Task {
                await self.closeEventSource(eventSourceId: eventSourceId)
            }
        }
        
        context.setObject(eventSourceCreate, forKeyedSubscript: "nativeEventSourceCreate" as NSString)
        context.setObject(eventSourceClose, forKeyedSubscript: "nativeEventSourceClose" as NSString)
    }
    
    private func createEventSource(
        in context: JSContext,
        url: String,
        eventSourceID: String,
        options: JSValue?
    ) async {
        // Create URL request
        guard let requestUrl = URL(string: url) else {
            print("❌ Invalid EventSource URL: \(url)")
            
            await handleEventSourceError(
                in: context,
                eventSourceID: eventSourceID,
                error: NSError(
                    domain: "EventSourceError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]
                )
            )
            return
        }
        
        var urlRequest = URLRequest(url: requestUrl)
        urlRequest.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        urlRequest.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        
        // Create EventSource with proper actor isolation
        let task = await Task { @EventSourceActor in
            let eventSource = EventSource()
            return eventSource.createTask(urlRequest: urlRequest)
        }.value
        
        // Store the task and start listening
        await MainActor.run {
            self.eventSources[eventSourceID] = task
        }
        
        // Start async task to handle events
        Task { [weak self] in
            guard let self = self else { return }
            
            for await event in await task.eventsStream() {
                await MainActor.run {
                    self.handleEventSourceEvent(
                        in: context,
                        eventSourceID: eventSourceID,
                        event: event
                    )
                }
            }
        }
        
        print("✅ EventSource created for URL: \(url)")
    }
    
    private func handleEventSourceEvent(
        in context: JSContext,
        eventSourceID: String,
        event: EventSourceTask.TaskEvent
    ) {
        let script: String
        
        switch event {
        case .open:
            script = """
                if (window.eventSourceInstances && window.eventSourceInstances['\(eventSourceID)']) {
                    window.eventSourceInstances['\(eventSourceID)']._handleOpen();
                }
            """
            
        case .closed:
            script = """
                if (window.eventSourceInstances && window.eventSourceInstances['\(eventSourceID)']) {
                    const instance = window.eventSourceInstances['\(eventSourceID)'];
                    instance.readyState = 2; // CLOSED
                    delete window.eventSourceInstances['\(eventSourceID)'];
                }
            """
            
        case .event(let eventData):
            let data = eventData.data?.replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
                .replacingOccurrences(of: "\r", with: "\\r") ?? ""
            
            let eventType = eventData.event?.replacingOccurrences(of: "'", with: "\\'") ?? "message"
            let eventId = eventData.id?.replacingOccurrences(of: "'", with: "\\'") ?? ""
            
            script = """
                if (window.eventSourceInstances && window.eventSourceInstances['\(eventSourceID)']) {
                    window.eventSourceInstances['\(eventSourceID)']._handleMessage('\(data)', '\(eventType)', '\(eventId)');
                }
            """
            
        case .error(let error):
            let errorMessage = error.localizedDescription.replacingOccurrences(of: "'", with: "\\'")
            script = """
                if (window.eventSourceInstances && window.eventSourceInstances['\(eventSourceID)']) {
                    window.eventSourceInstances['\(eventSourceID)']._handleError(new Error('\(errorMessage)'));
                }
            """
        }
        
        DispatchQueue.main.async {
            context.evaluateScript(script)
        }
    }
    
    private func closeEventSource(eventSourceId: String) async {
        await MainActor.run {
            if let task = self.eventSources[eventSourceId] {
                // Cancel task on the EventSourceActor
                Task { @EventSourceActor in
                    task.cancel()
                }
                self.eventSources.removeValue(forKey: eventSourceId)
                self.eventSourceCallbacks.removeValue(forKey: eventSourceId)
                print("✅ EventSource closed: \(eventSourceId)")
            }
        }
    }
    
    private func handleEventSourceError(
        in context: JSContext,
        eventSourceID: String,
        error: Error
    ) async {
        let errorMessage = error.localizedDescription.replacingOccurrences(of: "'", with: "\\'")
        let script = """
            if (window.eventSourceInstances && window.eventSourceInstances['\(eventSourceID)']) {
                window.eventSourceInstances['\(eventSourceID)']._handleError(new Error('\(errorMessage)'));
            }
        """
        
        await MainActor.run {
            _ = context.evaluateScript(script)
        }
        await closeEventSource(eventSourceId: eventSourceID)
    }
}
