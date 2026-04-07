---
"@ton/walletkit": patch
---

Move signature domain from signer to wallet adapters (WalletV4R2, WalletV5R1), removing `DefaultDomainSignature` export and `domain` parameter from `Signer.fromMnemonic`/`Signer.fromPrivateKey`
