#!/bin/sh
# scripts/jq/build-nav.jq — Generate nav <li> HTML from categories.txt
# Usage: awk -f scripts/jq/build-nav.awk data/categories.txt
# Output: HTML <li> elements for navigation

BEGIN {
    FS = "|"
    print "<ul class=\"category-nav\">"
}

/^[^#]/ && NF >= 3 {
    slug = $1
    label = $2
    href = $3
    printf "  <li><a href=\"%s\" data-category=\"%s\">%s</a></li>\n", href, slug, label
}
