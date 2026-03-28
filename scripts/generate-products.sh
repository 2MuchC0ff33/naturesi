#!/usr/bin/env yash
# scripts/generate-products.sh — POSIX CSV to JSON generator (pipe-delimited)
# Reads products.csv (pipe-delimited), emits products.json for browser
# Usage: scripts/generate-products.sh [csv_path] [json_out_path]

CSV="${1:-assets/js/data/products.csv}"
OUT="${2:-assets/js/data/products.json}"

if [ ! -f "$CSV" ]; then
    printf 'ERROR: CSV file not found: %s\n' "$CSV" >&2
    exit 1
fi

printf 'Generating %s from %s\n' "$OUT" "$CSV"

TMPOUT=$(mktemp)
TMPERR=$(mktemp)

# Write JSON header
{
    printf '{\n'
    printf '  "products": [\n'
} > "$TMPOUT"

FIRST_ROW=1
ROW_NUM=0

while IFS= read -r line; do
    ROW_NUM=$((ROW_NUM + 1))
    if [ "$ROW_NUM" -eq 1 ]; then
        continue  # skip header
    fi

    # Extract fields 1-8 using cut (safe, no CSV parsing issues)
    id=$(printf '%s' "$line" | cut -d'|' -f1)
    name=$(printf '%s' "$line" | cut -d'|' -f2)
    slug=$(printf '%s' "$line" | cut -d'|' -f3)
    category=$(printf '%s' "$line" | cut -d'|' -f4)
    desc=$(printf '%s' "$line" | cut -d'|' -f5)
    image=$(printf '%s' "$line" | cut -d'|' -f6)
    inStock=$(printf '%s' "$line" | cut -d'|' -f7)
    price=$(printf '%s' "$line" | cut -d'|' -f8)

    # Get options: join fields 9+ (pipe-separated, may contain JSON)
    opts=""
    total_fields=$(printf '%s' "$line" | tr -cd '|' | wc -c | tr -d ' ')
    total_fields=$((total_fields + 1))
    if [ "$total_fields" -ge 9 ]; then
        opts=$(printf '%s' "$line" | cut -d'|' -f9-)
    fi

    # Validate required fields
    if [ -z "$id" ]; then
        printf 'WARN: row %d has empty id, skipping\n' "$ROW_NUM" >> "$TMPERR"
        continue
    fi

    # JSON-escape strings (basic: escape " and \)
    j_escape() {
        printf '%s' "$1" | sed -e 's/\\/\\\\/g; s/"/\\"/g'
    }
    id_esc=$(j_escape "$id")
    name_esc=$(j_escape "$name")
    slug_esc=$(j_escape "$slug")
    cat_esc=$(j_escape "$category")
    desc_esc=$(j_escape "$desc")
    img_esc=$(j_escape "$image")

    # Price
    price_num=$(printf '%s' "$price" | sed -e 's/[^0-9.]//g')
    if [ -z "$price_num" ] || [ "$price_num" = "0" ] 2>/dev/null; then
        price_json="null"
    else
        price_json="$price_num"
    fi

    # Options: already in JSON format — use directly without escaping
    if [ -n "$opts" ] && printf '%s' "$opts" | grep -qE '^\['; then
        opts_json="$opts"
    else
        opts_json="[]"
    fi

    # Separator
    if [ "$FIRST_ROW" -eq 0 ]; then
        printf '    },\n' >> "$TMPOUT"
    fi
    FIRST_ROW=0

    # Write product object
    printf '    {\n' >> "$TMPOUT"
    printf '      "id": "%s",\n' "$id_esc" >> "$TMPOUT"
    printf '      "sku": "%s",\n' "$id_esc" >> "$TMPOUT"
    printf '      "name": "%s",\n' "$name_esc" >> "$TMPOUT"
    printf '      "slug": "%s",\n' "$slug_esc" >> "$TMPOUT"
    printf '      "category": "%s",\n' "$cat_esc" >> "$TMPOUT"
    printf '      "description": "%s",\n' "$desc_esc" >> "$TMPOUT"
    printf '      "image": "%s",\n' "$img_esc" >> "$TMPOUT"
    printf '      "imageAlt": "%s",\n' "$name_esc" >> "$TMPOUT"
    printf '      "images": ["%s"],\n' "$img_esc" >> "$TMPOUT"
    printf '      "inStock": %s,\n' "$inStock" >> "$TMPOUT"
    printf '      "price": %s,\n' "$price_json" >> "$TMPOUT"
    printf '      "options": %s,\n' "$opts_json" >> "$TMPOUT"
    printf '      "featured": false\n' >> "$TMPOUT"

done < "$CSV"

{
    printf '    }\n'
    printf '  ]\n'
    printf '}\n'
} >> "$TMPOUT"

mv "$TMPOUT" "$OUT"
chmod 644 "$OUT"
if jq . "$OUT" >/dev/null 2>&1; then
    PRODUCTS=$(jq '.products | length' "$OUT" 2>/dev/null || echo '?')
    printf '  OK: generated %s with %s products\n' "$OUT" "$PRODUCTS"
    exit 0
else
    printf '  FAIL: generated JSON is invalid\n' >&2
    jq . "$OUT" 2>&1 | head -10 >&2
    exit 1
fi
