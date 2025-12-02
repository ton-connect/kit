#!/usr/bin/env bash

# bash packages/walletkit/data/data.sh

set -euo pipefail

: "${TON_CENTER_URL:="https://toncenter.com/api/v3"}"
: "${TON_CENTER_KEY?Unset TON_CENTER_KEY}"

: "${TON_API_URL:="https://tonapi.io/v2"}"
: "${TON_API_KEY?Unset TON_API_KEY}"


ROOT_DIR=$(dirname "${BASH_SOURCE[0]}")

sample() {
  name="$1"
  event_address="$2"
  curl -s -H "Bearer: $TON_API_KEY" "$TON_API_URL/events/$event_address" | jq > "$ROOT_DIR/$name-events-local.json"
  curl -s -H "x-api-key: $TON_CENTER_KEY" "$TON_CENTER_URL/traces?trace_id=$event_address" | jq > "$ROOT_DIR/$name-traces.json"
}

# UQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3AF4
sample contract-call ed0059d3002e0a3738c8d874a98c6cab6647dc055ff904717335f74e21c427cf
sample contract-call-unknown b142f5e55f70cfc21ea19dd43727e675109327d63a0ed8486f30b9143c8a8b34
sample ft-received 63ca0d794bd993043441e0a58108b9004c7bfda04844cb534f1423eebf80173f
sample ft-sent 8d213f8019c3819383f171ba9d6618be1a314164083302354bff2fc91245bb80
sample nft-received 37c6c0484dcc0737cbea4f6dbf35200b91109f3afc5514caffe15c219b3391ab
sample nft-sent 386de7b1cb927b4f494412c0f38b012e6a32b231f78f108a399d760cea0f35ba
sample ton-received a19036b931366778b9a64061017e79bfb9c97db8c55d0fb9cc0ee8741901adf9
sample ton-sent f5079a2225e581ff140fd6e8963c5ba1cd795ea7da2761165cb7c7f786a9a847

# UQC8G3SPXSa3TYV3mP9N1CUqK3nPUbIyrkG-HxnozZVHt2Iv
sample ton-received-acc2 ab25529879ec1af29a36aa526efb113fc21a4faa095156342df765ce8ee79a1f