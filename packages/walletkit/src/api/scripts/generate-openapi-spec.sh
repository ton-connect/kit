#!/bin/bash
# Converts TypeScript interfaces to OpenAPI 3.0 specification
set -e  # Exit on error

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
SRC_ROOT="$SCRIPT_DIR/../.."
OUTPUT_FILE="$SCRIPT_DIR/generated/walletkit-openapi.json"
TEMP_SCHEMA="$SCRIPT_DIR/generated/temp-schema.json"

# Input glob: api/models + any models folders under defi
TYPESCRIPT_INPUT="$SRC_ROOT/{api/models,defi/**/models}/**/*.ts"

echo "🚀 Converting TypeScript to OpenAPI specification..."
echo "📁 TypeScript input: $TYPESCRIPT_INPUT"
echo "📄 Output file: $OUTPUT_FILE"
echo ""

# Step 1: Ensure generated directory exists
mkdir -p "$SCRIPT_DIR/generated"

# Step 2: Generate JSON Schema using custom generator (with x-enum-varnames)
echo "📝 Step 1: Generating JSON Schema with enum member names..."
node "$SCRIPT_DIR/generate-json-schema.js" "$TYPESCRIPT_INPUT" "$TEMP_SCHEMA" || {
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