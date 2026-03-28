#!/bin/sh
# scripts/awk/json-report.awk — Generate structured report from JSON stream
# Usage: cat products.json | jq -c '.products[]' | awk -f scripts/awk/json-report.awk
# Output: formatted report from jq -c (compact JSON) stream

BEGIN {
    FS = ""
    count = 0
    total_price = 0
    in_stock = 0
    out_stock = 0
}

/[^{]*/ { next }  # Skip non-JSON lines

# Match compact JSON object: {"id":"...","name":"...",...}
/"id":/ && /"name":/ && /"price":/ {
    count++

    # Extract id
    if (match($0, /"id":[[:space:]]*"([^"]+)"/, arr)) {
        id = arr[1]
    }

    # Extract name
    if (match($0, /"name":[[:space:]]*"([^"]+)"/, arr)) {
        name = arr[1]
    }

    # Extract price
    if (match($0, /"price":[[:space:]]*([0-9.]+)/, arr)) {
        price = arr[1] + 0
        total_price += price
        if (price < min_price || min_price == 0) min_price = price
        if (price > max_price) max_price = price
    }

    # Extract inStock
    if (match($0, /"inStock":[[:space:]]*(true|false)/, arr)) {
        if (arr[1] == "true") in_stock++
        else out_stock++
    }

    # Extract category
    if (match($0, /"category":[[:space:]]*"([^"]+)"/, arr)) {
        cat = arr[1]
        cat_count[cat]++
    }
}

END {
    printf "=== JSON Report ===\n"
    printf "Total items: %d\n", count
    if (count > 0) {
        printf "Avg price: $%.2f\n", total_price / count
        printf "Price range: $%.2f - $%.2f\n", min_price, max_price
        printf "In stock: %d\n", in_stock
        printf "Out of stock: %d\n", out_stock
    }
    printf "\nBy category:\n"
    for (c in cat_count) {
        printf "  %s: %d\n", c, cat_count[c]
    }
}
