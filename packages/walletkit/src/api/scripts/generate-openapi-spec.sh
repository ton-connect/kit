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

# Step 1: Validate TypeScript input
if [ ! -d "$TYPESCRIPT_INPUT" ] && [ ! -f "$TYPESCRIPT_INPUT" ]; then
    echo "❌ Error: TypeScript input not found at '$TYPESCRIPT_INPUT'"
    exit 1
fi

# Step 2: Ensure generated directory exists
mkdir -p "$SCRIPT_DIR/generated"

# Step 3: Generate JSON Schema using custom generator (with x-enum-varnames)
echo "📝 Step 1: Generating JSON Schema with enum member names..."
node "$SCRIPT_DIR/generate-json-schema.js" "$TYPESCRIPT_INPUT/**/*.ts" "$TEMP_SCHEMA" || {
    echo "❌ Failed to generate JSON Schema"
    exit 1
}
echo "✅ JSON Schema generated: $TEMP_SCHEMA"

# Step 4: Convert JSON Schema to OpenAPI spec
echo "📝 Step 2: Converting JSON Schema to OpenAPI spec..."

# Check if @openapi-contrib/json-schema-to-openapi-schema is available
npx --yes @openapi-contrib/json-schema-to-openapi-schema --help &> /dev/null || {
    echo "⚠️  Installing @openapi-contrib/json-schema-to-openapi-schema..."
    npm install -g @openapi-contrib/json-schema-to-openapi-schema
}

# Run the conversion script
NODE_PATH=$(npm root -g) node "$SCRIPT_DIR/json-schema-to-openapi-spec.js" "$TEMP_SCHEMA" "$OUTPUT_FILE" || {
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
echo "OPENAPI_SPEC_PATH=$OUTPUT_FILE"