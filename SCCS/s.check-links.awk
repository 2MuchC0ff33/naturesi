h63385
s 00092/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/awk/check-links.awk — Parse HTML and categorize links
# Usage: awk -f scripts/awk/check-links.awk pages/*.html
# Output: list of links categorized as internal/external/anchor

BEGIN {
    FS = ""
    internal = 0
    external = 0
    anchor = 0
    missing_href = 0
    file_count = 0
}

FNR == 1 && NR > 1 {
    if (file_count > 0) {
        printf "  internal=%d external=%d anchor=%d missing=%d\n", internal, external, anchor, missing_href
        total_internal += internal
        total_external += external
        total_anchor += anchor
        total_missing += missing_href
    }
    printf "\n=== %s ===\n", FILENAME
    internal = 0; external = 0; anchor = 0; missing_href = 0
    file_count++
}

# Match href attributes (simplified — works for inline attributes)
/href=[[:space:]]*"/ {
    # Extract value between quotes
    gsub(/^.*href=[[:space:]]*"/, "")
    gsub(/".*/, "")
    href = $0
    next
}
/href=[[:space:]]*'/' {
    # href="/path"
    href = "/path"
    next
}

# Process extracted href
function categorize(href) {
    if (href == "") {
        missing_href++
        return
    }
    if (substr(href, 1, 1) == "#") {
        anchor++
        printf "  [ANCHOR] %s\n", href
    } else if (substr(href, 1, 1) == "/" && substr(href, 2, 1) != "/") {
        internal++
        printf "  [INTERNAL] %s\n", href
    } else if (match(href, /^[a-z]+:\/\//)) {
        external++
        printf "  [EXTERNAL] %s\n", href
    } else if (substr(href, 1, 2) == "//") {
        # Protocol-relative URL
        external++
        printf "  [EXTERNAL] //%s\n", substr(href, 3)
    } else {
        # Relative path
        internal++
        printf "  [INTERNAL-REL] %s\n", href
    }
}

# Match src attributes for images/scripts
/src=[[:space:]]*"/ {
    gsub(/^.*src=[[:space:]]*"/, "")
    gsub(/".*/, "")
    if ($0 != "") {
        internal++
        printf "  [SRC] %s\n", $0
    }
}

END {
    if (file_count > 0) {
        printf "  internal=%d external=%d anchor=%d missing=%d\n", internal, external, anchor, missing_href
        total_internal += internal
        total_external += external
        total_anchor += anchor
        total_missing += missing_href
    }
    printf "\n=== Totals ===\n"
    printf "Files: %d\n", file_count
    printf "Internal links: %d\n", total_internal
    printf "External links: %d\n", total_external
    printf "Anchor links: %d\n", total_anchor
    printf "Missing href: %d\n", total_missing
}
E 1
