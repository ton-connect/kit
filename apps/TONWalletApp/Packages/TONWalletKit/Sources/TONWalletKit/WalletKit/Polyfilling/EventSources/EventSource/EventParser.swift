import Foundation

struct EventParser {
    private var buffer = Data()
    
    mutating func parse(_ data: Data) -> [Event] {
        let (chunks, remaining) = extractChunks(buffer: buffer + data)
        buffer = remaining
        return parseChunks(chunks)
    }
    
    private func parseChunks(_ chunks: [Data]) -> [Event] {
        chunks.compactMap { parseEvent(chunk: $0) }
    }
    
    private func extractChunks(buffer: Data) -> (chunks: [Data], remaining: Data) {
        var buffer = buffer
        var chunks = [Data]()
        
        while let delimeterRange = getDelimeterRange(buffer: buffer) {
            let chunk = buffer[buffer.startIndex ..< delimeterRange.lowerBound]
            chunks.append(chunk)
            
            buffer = buffer[delimeterRange.upperBound ..< buffer.endIndex]
        }
        
        return (chunks, buffer)
    }
    
    private func getDelimeterRange(buffer: Data) -> Range<Data.Index>? {
        guard let range = buffer.firstRange(of: [UInt8.nl, UInt8.nl]) else { return nil }
        return range
    }
    
    private func parseEvent(chunk: Data) -> Event? {
        guard !chunk.isEmpty && chunk.first != .colon else {
            return nil
        }
        
        let rows = chunk.split(separator: .nl)
        var event = Event()
        
        for row in rows {
            let keyValue = row.split(separator: .colon, maxSplits: 1)
            let key = keyValue[0].string
            guard var value = keyValue[safe: 1]?.string else { continue }
            if value.hasPrefix(" ") {
                value = String(value.dropFirst())
            }
            
            switch key {
            case "id": event.id = value
            case "event": event.event = value
            case "data": event.data = value
            default: continue
            }
        }
        
        guard !event.isEmpty else { return nil }
        return event
    }
}

private extension UInt8 {
    static let nl: UInt8 = 0x0A
    static let colon: UInt8 = 0x3A
}

private extension Data {
    
    var string: String {
        String(decoding: self, as: UTF8.self)
    }
}
