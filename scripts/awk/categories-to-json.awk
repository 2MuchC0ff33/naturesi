#!/bin/sh
# scripts/jq/categories-to-json.jq — Convert categories.txt to categories.json
# Usage: cat data/categories.txt | awk -f scripts/awk/categories-to-json.awk | jq -Rn 'fromjson'
# Or:  awk -f scripts/awk/categories-to-json.awk data/categories.txt > assets/js/data/categories.json

BEGIN {
    FS = "|"
    print "["
    first = 1
}

/^[^#]/ && NF >= 3 {
    if (!first) print ","
    first = 0
    gsub(/"/, "\\\"", $2)
    gsub(/"/, "\\\"", $3)
    printf "  {\"slug\": \"%s\", \"label\": \"%s\", \"href\": \"%s\"}", $1, $2, $3
}
