# TonConnect Kit

## Testing

The testing environment uses `vitest` for faster test execution and includes mutation testing to verify test effectiveness, expected coverage and quality parameters are stored in a [quality.config.js](quality.config.js), `jest` is also used for better IDE compatibility.

```bash
pnpm kit check   # lint and test
pnpm kit quality # lint, test with coverage & mutation
```
