# TON Wallet Telegram Bot

A conversational Telegram bot that lets you manage your TON wallet using natural language. Powered by Claude AI.

## Features

### Wallet Management
- **Automatic wallet creation** — Your wallet is created automatically when you start the bot
- **Check balance** — View your TON and token balances anytime
- **Get your address** — Easily share your wallet address to receive funds

### Send & Receive
- **Send TON** — Transfer TON to any address or Telegram username
- **Send tokens** — Transfer Jettons (USDT, etc.) with simple commands
- **Add comments** — Include messages with your transfers

### Token Swaps
- **Swap tokens** — Exchange TON for tokens or tokens for TON
- **Get quotes** — Preview swap rates before executing

### Social Features
- **Send to @username** — Transfer to other bot users by their Telegram handle
- **Look up users** — Find wallet addresses of other bot users

### Transaction History
- **View transactions** — See your recent incoming and outgoing transfers

---

## User Guide

### Getting Started

1. **Start the bot** — Send `/start` to create your wallet
2. **Fund your wallet** — Copy your address and send some TON to it
3. **Start chatting** — Just tell the bot what you want to do!

### Example Commands

You can talk to the bot naturally. Here are some examples:

**Check Balance:**
- "What's my balance?"
- "How much TON do I have?"
- "Show my tokens"

**Get Your Address:**
- "What's my address?"
- "Show my wallet"

**Send TON:**
- "Send 1 TON to UQxxxxx..."
- "Transfer 0.5 TON to @username"
- "Send 2 TON to @friend with message 'Thanks!'"

**Send Tokens:**
- "Send 10 USDT to UQxxxxx..."
- "Transfer 50 USDT to @username"

**Swap Tokens:**
- "Swap 1 TON to USDT"
- "Exchange 10 USDT for TON"
- "How much USDT can I get for 5 TON?"

**Transaction History:**
- "Show my transactions"
- "What were my last 5 transfers?"

**Look Up Users:**
- "What's @username's address?"
- "Find @friend"

### Group Chats

The bot works in group chats too! Just mention it:
- "@YourBotName what's my balance?"
- "@YourBotName send 1 TON to @friend"

---

## Setup (Self-Hosting)

### Prerequisites

- Node.js 18+
- pnpm
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Anthropic API Key (from [Anthropic Console](https://console.anthropic.com))

### Installation

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```

2. Create your environment file:
   ```bash
   cp apps/mcp-telegram/.env.example apps/mcp-telegram/.env
   ```

3. Configure your `.env` file:
   ```env
   # Required
   TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
   ANTHROPIC_API_KEY=your-anthropic-api-key
   WALLET_ENCRYPTION_KEY=<generate with: openssl rand -hex 32>

   # Optional
   TON_NETWORK=testnet  # or mainnet
   ANTHROPIC_MODEL=claude-opus-4-5-20250514
   TONCENTER_API_KEY_TESTNET=your-toncenter-key
   ```

4. Start the bot:
   ```bash
   pnpm --filter @ton/mcp-telegram dev
   ```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from BotFather |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `WALLET_ENCRYPTION_KEY` | Yes | 32-byte hex key for encrypting wallet data |
| `TON_NETWORK` | No | `testnet` (default) or `mainnet` |
| `ANTHROPIC_MODEL` | No | Claude model (default: `claude-opus-4-5-20250514`) |
| `DATABASE_PATH` | No | SQLite database path |
| `TONCENTER_API_KEY_MAINNET` | No | TonCenter API key for mainnet |
| `TONCENTER_API_KEY_TESTNET` | No | TonCenter API key for testnet |

---

## Security Notes

- **Private keys are encrypted** — All wallet keys are encrypted with your `WALLET_ENCRYPTION_KEY`
- **Non-custodial design** — Each user has their own encrypted wallet
- **No confirmation required** — Transfers execute immediately (configure `requireConfirmation` in code if needed)

---

## Architecture

```
User Message
    ↓
Telegram Bot (grammY)
    ↓
Claude AI (Anthropic)
    ↓
Tool Execution (@ton/mcp)
    ↓
TON Blockchain
```

The bot uses Claude's tool-calling capability to understand user intent and execute the appropriate wallet operations through the `@ton/mcp` package.

---

## License

MIT
