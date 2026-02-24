/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * LLMService - Anthropic Claude-based LLM integration with tool calling
 *
 * Features:
 * - Natural language processing via Anthropic Claude
 * - Native tool calling support
 * - Tool execution loop with result handling
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Tool, ToolResultBlockParam, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';

/**
 * Tool definition for the LLM
 */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description: string; enum?: string[] }>;
        required?: string[];
    };
    handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Configuration for LLMService
 */
export interface LLMServiceConfig {
    apiKey: string;
    model: string;
}

/**
 * Conversation history entry
 */
interface ConversationEntry {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

/**
 * Max messages to keep in history per user
 */
const MAX_HISTORY_LENGTH = 20;

/**
 * Max age of messages in history (30 minutes)
 */
const MAX_HISTORY_AGE_MS = 30 * 60 * 1000;

/**
 * LLMService handles natural language processing with tool calling
 */
export class LLMService {
    private readonly anthropic: Anthropic;
    private readonly model: string;
    private tools: ToolDefinition[] = [];
    private toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();
    private conversationHistory: Map<string, ConversationEntry[]> = new Map();

    constructor(config: LLMServiceConfig) {
        this.anthropic = new Anthropic({ apiKey: config.apiKey });
        this.model = config.model;
    }

    /**
     * Get conversation history for a user, filtering out old messages
     */
    private getHistory(userId: string): ConversationEntry[] {
        const history = this.conversationHistory.get(userId) ?? [];
        const now = Date.now();

        // Filter out old messages
        const filtered = history.filter((entry) => now - entry.timestamp < MAX_HISTORY_AGE_MS);

        // Keep only recent messages
        const trimmed = filtered.slice(-MAX_HISTORY_LENGTH);

        this.conversationHistory.set(userId, trimmed);
        return trimmed;
    }

    /**
     * Add a message to conversation history
     */
    private addToHistory(userId: string, role: 'user' | 'assistant', content: string): void {
        const history = this.getHistory(userId);
        history.push({ role, content, timestamp: Date.now() });
        this.conversationHistory.set(userId, history.slice(-MAX_HISTORY_LENGTH));
    }

    /**
     * Clear conversation history for a user
     */
    clearHistory(userId: string): void {
        this.conversationHistory.delete(userId);
    }

    /**
     * Register tools that the LLM can call
     */
    registerTools(tools: ToolDefinition[]): void {
        this.tools = tools;
        this.toolHandlers.clear();
        for (const tool of tools) {
            this.toolHandlers.set(tool.name, tool.handler);
        }
    }

    /**
     * Get Anthropic-formatted tool definitions
     */
    private getAnthropicTools(): Tool[] {
        return this.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters,
        }));
    }

    /**
     * Execute a tool call and return the result
     */
    private async executeTool(toolUse: ToolUseBlock): Promise<string> {
        const handler = this.toolHandlers.get(toolUse.name);
        if (!handler) {
            return JSON.stringify({ error: `Unknown tool: ${toolUse.name}` });
        }

        try {
            const args = toolUse.input as Record<string, unknown>;
            const result = await handler(args);
            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify({
                error: error instanceof Error ? error.message : 'Tool execution failed',
            });
        }
    }

    /**
     * Process a user message with conversation history
     * Returns the final response after all tool calls are resolved
     */
    async chat(userId: string, userMessage: string, systemPrompt?: string): Promise<string> {
        const messages: MessageParam[] = [];

        // Add conversation history
        const history = this.getHistory(userId);
        for (const entry of history) {
            messages.push({ role: entry.role, content: entry.content });
        }

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        // Add to history
        this.addToHistory(userId, 'user', userMessage);

        // Tool calling loop
        const maxIterations = 10;
        let iterations = 0;

        while (iterations < maxIterations) {
            iterations++;

            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages,
                tools: this.getAnthropicTools(),
            });

            // Check for tool use blocks
            const toolUseBlocks = response.content.filter((block): block is ToolUseBlock => block.type === 'tool_use');

            if (toolUseBlocks.length > 0) {
                // Add assistant response with tool use
                messages.push({ role: 'assistant', content: response.content });

                // Execute tools and add results
                const toolResults: ToolResultBlockParam[] = [];
                for (const toolUse of toolUseBlocks) {
                    const result = await this.executeTool(toolUse);
                    toolResults.push({
                        type: 'tool_result',
                        tool_use_id: toolUse.id,
                        content: result,
                    });
                }
                messages.push({ role: 'user', content: toolResults });

                // Continue the loop to let the model process tool results
                continue;
            }

            // No more tool calls, return the final response
            const textBlock = response.content.find((block) => block.type === 'text');
            const responseContent = textBlock?.type === 'text' ? textBlock.text : '';

            // Add assistant response to history
            this.addToHistory(userId, 'assistant', responseContent);

            return responseContent;
        }

        return 'Sorry, I encountered an issue processing your request. Please try again.';
    }
}
