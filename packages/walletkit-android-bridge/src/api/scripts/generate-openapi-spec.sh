#!/bin/bash
# Converts TypeScript interfaces to OpenAPI 3.0 specification
set -e  # Exit on error

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
TYPESCRIPT_INPUT="$SCRIPT_DIR/../models"
OUTPUT_FILE="$SCRIPT_DIR/generated/walletkit-openapi.json"
TEMP_SCHEMA="$SCRIPT_DIR/generated/temp-schema.json"

if [ -z "$TYPESCRIPT_INPUT" ]; then
    echo "❌ Error: TypeScript input path is required"
fi

echo "🚀 Converting TypeScript to OpenAPI specification..."
echo "📁 TypeScript input: $TYPESCRIPT_INPUT"
echo "📄 Output file: $OUTPUT_FILE"
echo ""

# Step 1: Check if ts-json-schema-generator is installed
echo "🔍 Checking for ts-json-schema-generator..."
if ! command -v ts-json-schema-generator &> /dev/null; then
    echo "⚠️  ts-json-schema-generator not found. Installing..."
    npm install -g ts-json-schema-generator
fi

# Step 2: Validate TypeScript input
if [ ! -d "$TYPESCRIPT_INPUT" ] && [ ! -f "$TYPESCRIPT_INPUT" ]; then
    echo "❌ Error: TypeScript input not found at '$TYPESCRIPT_INPUT'"
    exit 1
fi

# Step 3: Generate JSON Schema from TypeScript
echo "📝 Generating JSON Schema from TypeScript..."

# Determine the path pattern based on input type
if [ -d "$TYPESCRIPT_INPUT" ]; then
    PATH_PATTERN="$TYPESCRIPT_INPUT/**/*.ts"
else
    PATH_PATTERN="$TYPESCRIPT_INPUT"
fi

ts-json-schema-generator \
    --path "$PATH_PATTERN" \
    --type "*" \
    --out "$TEMP_SCHEMA" \
    --expose all \
    --jsDoc extended \
    --no-type-check

echo "✅ JSON Schema generated: $TEMP_SCHEMA"

# Step 4: Convert JSON Schema to OpenAPI spec
echo "📝 Converting JSON Schema to OpenAPI spec..."

# Check if @openapi-contrib/json-schema-to-openapi-schema is available
npx --yes @openapi-contrib/json-schema-to-openapi-schema --help &> /dev/null || {
    echo "⚠️  Installing @openapi-contrib/json-schema-to-openapi-schema..."
    npm install -g @openapi-contrib/json-schema-to-openapi-schema
}

NODE_PATH=$(npm root -g) node "$SCRIPT_DIR/convert-schema-to-openapi.cjs" "$TEMP_SCHEMA" "$OUTPUT_FILE" || {
    echo "❌ Failed to convert JSON Schema to OpenAPI"
    rm -f "$TEMP_SCHEMA"
    exit 1
}

# Cleanup
rm -f "$TEMP_SCHEMA"

echo ""
echo "🎉 Conversion complete!"
echo "📄 OpenAPI spec: $OUTPUT_FILE"
echo ""

# Return the output file path (for use in other scripts)
echo "$OUTPUT_FILE"