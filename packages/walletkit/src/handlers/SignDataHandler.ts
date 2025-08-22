// Sign data request handler

import { SignDataPayload } from '@tonconnect/protocol';

import type { EventSignDataRequest, SignDataPreview } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventSignData } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { globalLogger } from '../core/Logger';
import { validateSignDataPayload } from '../validation/signData';
import { parseTLB } from '../utils/tlb-runtime';

const log = globalLogger.createChild('SignDataHandler');

export class SignDataHandler
    extends BasicHandler<EventSignDataRequest>
    implements EventHandler<EventSignDataRequest, RawBridgeEventSignData>
{
    canHandle(event: RawBridgeEvent): event is RawBridgeEventSignData {
        return event.method === 'signData';
    }

    async handle(event: RawBridgeEventSignData): Promise<EventSignDataRequest> {
        if (!event.wallet) {
            throw new Error('No wallet found in event');
        }

        const data = this.parseDataToSign(event);
        if (!data) {
            log.error('No data to sign found in request', { event });
            throw new Error('No data to sign found in request');
        }
        const preview = this.createDataPreview(data, event);
        if (!preview) {
            log.error('No preview found for data', { data });
            throw new Error('No preview found for data');
        }

        const url = new URL(event.domain);
        const signEvent: EventSignDataRequest = {
            from: event.from,
            id: event.id,
            data,
            preview,
            wallet: event.wallet,
            domain: url.hostname,
        };

        return signEvent;
    }

    /**
     * Parse data to sign from bridge event
     */
    private parseDataToSign(event: RawBridgeEventSignData): SignDataPayload | undefined {
        try {
            const parsed = JSON.parse(event.params[0]) as SignDataPayload;

            const validationResult = validateSignDataPayload(parsed);

            if (validationResult) {
                log.error('Invalid data to sign found in request', { validationResult });
                return undefined;
            }

            return parsed;
        } catch (error) {
            log.error('Invalid data to sign found in request', { error });
            return undefined;
        }
    }

    /**
     * Create human-readable preview of data to sign
     */
    private createDataPreview(data: SignDataPayload, _event: RawBridgeEvent): SignDataPreview | undefined {
        if (data.type === 'text') {
            return {
                kind: 'text',
                content: data.text,
            };
        }

        if (data.type === 'binary') {
            return {
                kind: 'binary',
                content: data.bytes,
            };
        }

        if (data.type === 'cell') {
            if (!data.schema) {
                return {
                    kind: 'cell',
                    content: data.cell,
                };
            }
            try {
                const parsed = parseTLB(data.schema).deserialize(data.cell) as unknown as Record<string, unknown>;
                return {
                    kind: 'cell',
                    schema: data.schema,
                    content: data.cell,
                    parsed,
                };
            } catch (error) {
                log.error('Error deserializing cell', { error });
                return {
                    kind: 'cell',
                    content: data.cell,
                };
            }
        }

        return undefined;
    }
}
