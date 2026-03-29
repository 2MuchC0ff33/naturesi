#!/bin/sh
# scripts/awk/css-complexity.awk — Compute CSS complexity metrics
# Usage: awk -f scripts/awk/css-complexity.awk assets/css/partials/**/*.css
# Output: selectors per file, nesting depth, declarations per rule

BEGIN {
    FS = ""
    file_count = 0
    total_selectors = 0
    total_declarations = 0
    total_nesting = 0
    in_rule = 0
    brace_depth = 0
}

FNR == 1 && NR > 1 {
    # New file
    if (file_count > 0) {
        printf "%s: selectors=%d nesting=%.1f declarations=%d\n", prev_file, sel_count, total_sel_nesting/sel_count, decl_count
        total_selectors += sel_count
        total_declarations += decl_count
        total_nesting += total_sel_nesting
    }
    prev_file = FILENAME
    sel_count = 0
    decl_count = 0
    total_sel_nesting = 0
    in_rule = 0
    brace_depth = 0
    file_count++
}

# Skip comments
/\/\*/ { next }
/\*\// { next }

# Track brace depth for nesting
/\{/ { brace_depth++ }
/\}/ { brace_depth-- }

# Count selector lines (lines with { that are not declarations)
#[{][^}]*$/ && !/:\s*[^;{}]+;/ {
# A selector line ends with { and doesn't contain declarations
/\{$/ && !/:\s*[^;{}]+;/ {
    sel_count++
    total_sel_nesting += brace_depth
    next
}

# Count declaration lines (contain : but not { or })
/:\s*[^;{}]+;/ && !/\{/ && !/\}/ {
    decl_count++
}

END {
    if (file_count > 0) {
        # Print last file stats
        printf "%s: selectors=%d nesting=%.1f declarations=%d\n", prev_file, sel_count, sel_count > 0 ? total_sel_nesting/sel_count : 0, decl_count
        total_selectors += sel_count
        total_declarations += decl_count
        total_nesting += total_sel_nesting
    }
    printf "\n=== CSS Complexity Summary ===\n"
    printf "Files: %d\n", file_count
    printf "Total selectors: %d\n", total_selectors
    printf "Total declarations: %d\n", total_declarations
    printf "Overall avg nesting depth: %.2f\n", total_selectors > 0 ? total_nesting/total_selectors : 0
    printf "Avg declarations per selector: %.2f\n", total_selectors > 0 ? total_declarations/total_selectors : 0
}
