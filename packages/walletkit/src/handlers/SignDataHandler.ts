// Sign data request handler

import { SignDataPayload } from '@tonconnect/protocol';
import { parseTLB } from '@ton-community/tlb-runtime';

import type { EventSignDataRequest, SignDataPreview } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventSignData } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { globalLogger } from '../core/Logger';
import { validateSignDataPayload } from '../validation/signData';
import { WalletKitError, ERROR_CODES } from '../errors';

const log = globalLogger.createChild('SignDataHandler');

export class SignDataHandler
    extends BasicHandler<EventSignDataRequest>
    implements EventHandler<EventSignDataRequest, RawBridgeEventSignData>
{
    canHandle(event: RawBridgeEvent): event is RawBridgeEventSignData {
        return event.method === 'signData';
    }

    async handle(event: RawBridgeEventSignData): Promise<EventSignDataRequest> {
        if (!event.walletAddress) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'No wallet address found in sign data event',
                undefined,
                { eventId: event.id },
            );
        }

        const data = this.parseDataToSign(event);
        if (!data) {
            log.error('No data to sign found in request', { event });
            throw new WalletKitError(ERROR_CODES.INVALID_REQUEST_EVENT, 'No data to sign found in request', undefined, {
                eventId: event.id,
            });
        }
        const preview = this.createDataPreview(data, event);
        if (!preview) {
            log.error('No preview found for data', { data });
            throw new WalletKitError(
                ERROR_CODES.RESPONSE_CREATION_FAILED,
                'Failed to create preview for sign data request',
                undefined,
                { eventId: event.id, data },
            );
        }

        const signEvent: EventSignDataRequest = {
            ...event,
            request: data,
            preview,
            walletAddress: event.walletAddress,
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
