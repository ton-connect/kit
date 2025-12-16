---
'@ton/walletkit': patch
---

- Updated DefaultSignature to accept private key in both 32/64 bytes format
- Rename signDataRequest to approveSignDataRequest for consistency
- Update rejectSignDataRequest to properly respond with id
- Add exports for CreateTonProofMessageBytes, ConvertTonProofMessage
