/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Extensible message handler architecture
 * Allows registration of custom handlers for different message types
 */

import { MessageType } from './opcodes';
import { DecodedMessage } from './messageDecoder';
import { Action, AddressBook } from '../AccountEvent';
import { ToncenterTraceItem, ToncenterTransaction } from '../emulation';

/**
 * Context for message handling
 */
export interface MessageHandlerContext {
    ownerAddress: string;
    traceItem: ToncenterTraceItem;
    transactions: Record<string, ToncenterTransaction>;
    addressBook: AddressBook;
}

/**
 * Message handler interface
 */
export interface MessageHandler {
    /**
     * Message type this handler processes
     */
    messageType: MessageType;

    /**
     * Priority (lower number = higher priority)
     */
    priority?: number;

    /**
     * Check if this handler can process the message
     */
    canHandle(message: DecodedMessage, context: MessageHandlerContext): boolean;

    /**
     * Process the message and return actions
     */
    handle(message: DecodedMessage, context: MessageHandlerContext): Action[];
}

/**
 * Message handler registry
 */
class MessageHandlerRegistry {
    private handlers: Map<MessageType, MessageHandler[]> = new Map();

    /**
     * Register a message handler
     */
    register(handler: MessageHandler): void {
        const existing = this.handlers.get(handler.messageType) || [];
        existing.push(handler);
        // Sort by priority (lower number = higher priority)
        existing.sort((a, b) => (a.priority || 100) - (b.priority || 100));
        this.handlers.set(handler.messageType, existing);
    }

    /**
     * Unregister a handler
     */
    unregister(handler: MessageHandler): void {
        const existing = this.handlers.get(handler.messageType);
        if (existing) {
            const filtered = existing.filter((h) => h !== handler);
            this.handlers.set(handler.messageType, filtered);
        }
    }

    /**
     * Get all handlers for a message type
     */
    getHandlers(messageType: MessageType): MessageHandler[] {
        return this.handlers.get(messageType) || [];
    }

    /**
     * Find the first handler that can handle the message
     */
    findHandler(message: DecodedMessage, context: MessageHandlerContext): MessageHandler | null {
        const handlers = this.getHandlers(message.messageType);
        for (const handler of handlers) {
            if (handler.canHandle(message, context)) {
                return handler;
            }
        }
        return null;
    }

    /**
     * Process a message with the appropriate handler
     */
    handle(message: DecodedMessage, context: MessageHandlerContext): Action[] {
        const handler = this.findHandler(message, context);
        if (handler) {
            return handler.handle(message, context);
        }
        return [];
    }

    /**
     * Get all registered message types
     */
    getRegisteredTypes(): MessageType[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * Clear all handlers
     */
    clear(): void {
        this.handlers.clear();
    }
}

/**
 * Global message handler registry
 */
export const messageHandlerRegistry = new MessageHandlerRegistry();

/**
 * Base message handler with common utilities
 */
export abstract class BaseMessageHandler implements MessageHandler {
    abstract messageType: MessageType;
    priority?: number;

    abstract canHandle(message: DecodedMessage, context: MessageHandlerContext): boolean;
    abstract handle(message: DecodedMessage, context: MessageHandlerContext): Action[];

    /**
     * Helper: check if value is a record
     */
    protected isRecord(v: unknown): v is Record<string, unknown> {
        return typeof v === 'object' && v !== null;
    }

    /**
     * Helper: get property from payload
     */
    protected getProperty<T = unknown>(payload: unknown, key: string): T | undefined {
        if (this.isRecord(payload)) {
            return payload[key] as T | undefined;
        }
        return undefined;
    }

    /**
     * Helper: safely convert to bigint
     */
    protected toBigInt(value?: string | number): bigint {
        if (value === undefined || value === null) return BigInt(0);
        const n = typeof value === 'string' ? Number(value) : value;
        return BigInt(Number.isFinite(n) ? n : 0);
    }

    /**
     * Helper: extract comment from decoded payload
     */
    protected extractComment(payload: unknown): string | null {
        if (!this.isRecord(payload)) return null;
        const type = payload['@type'];
        if (type === 'text_comment') {
            const text = payload['text'];
            if (typeof text === 'string' && text.length > 0) return text;
        }
        const comment = payload['comment'];
        if (typeof comment === 'string' && comment.length > 0) return comment;
        return null;
    }
}

/**
 * Decorator for registering handlers automatically
 */
export function RegisterMessageHandler(messageType: MessageType, priority?: number) {
    return function <T extends { new (...args: unknown[]): MessageHandler }>(constructor: T): T {
        // Create and register instance
        const instance = new constructor();
        instance.messageType = messageType;
        if (priority !== undefined) {
            instance.priority = priority;
        }
        messageHandlerRegistry.register(instance);
        return constructor;
    };
}

/**
 * Fluent builder for creating handlers
 */
export class MessageHandlerBuilder {
    private _messageType?: MessageType;
    private _priority?: number;
    private _canHandle?: (message: DecodedMessage, context: MessageHandlerContext) => boolean;
    private _handle?: (message: DecodedMessage, context: MessageHandlerContext) => Action[];

    messageType(type: MessageType): this {
        this._messageType = type;
        return this;
    }

    priority(priority: number): this {
        this._priority = priority;
        return this;
    }

    canHandle(fn: (message: DecodedMessage, context: MessageHandlerContext) => boolean): this {
        this._canHandle = fn;
        return this;
    }

    handle(fn: (message: DecodedMessage, context: MessageHandlerContext) => Action[]): this {
        this._handle = fn;
        return this;
    }

    build(): MessageHandler {
        if (!this._messageType) {
            throw new Error('MessageType is required');
        }
        if (!this._canHandle) {
            throw new Error('canHandle function is required');
        }
        if (!this._handle) {
            throw new Error('handle function is required');
        }

        const messageType = this._messageType;
        const priority = this._priority;
        const canHandle = this._canHandle;
        const handle = this._handle;

        return {
            messageType,
            priority,
            canHandle,
            handle,
        };
    }

    register(): this {
        const handler = this.build();
        messageHandlerRegistry.register(handler);
        return this;
    }
}

/**
 * Create a new message handler builder
 */
export function createMessageHandler(): MessageHandlerBuilder {
    return new MessageHandlerBuilder();
}
