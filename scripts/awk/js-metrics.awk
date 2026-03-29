#!/bin/sh
# scripts/awk/js-metrics.awk — Compute JS complexity metrics
# Usage: awk -f scripts/awk/js-metrics.awk assets/js/modules/*.js
# Output: function count, export count, comment density

BEGIN {
    FS = ""
    in_block_comment = 0
    in_string = 0
    string_char = ""
    total_lines = 0
    comment_lines = 0
    code_lines = 0
    function_count = 0
    export_count = 0
    class_count = 0
    async_count = 0
    file_count = 0
}

FNR == 1 && NR > 1 {
    # New file summary
    if (file_count > 0) {
        printf "%s: funcs=%d async=%d exports=%d classes=%d comments=%d%%\n", prev_file, f, a, e, c, pct
        total_funcs += f; total_async += a; total_exports += e
        total_classes += c; total_comments += comment_lines
        total_code += code_lines
    }
    prev_file = FILENAME
    f = 0; a = 0; e = 0; c = 0
    comment_lines = 0
    code_lines = 0
    in_block_comment = 0
    in_string = 0
    total_lines = 0
    file_count++
}

# Track block comments
/\/\*/ { in_block_comment = 1 }
/\*\// {
    in_block_comment = 0
    comment_lines++
    next
}
in_block_comment == 1 {
    comment_lines++
    next
}

# Track line comments (simplified)
/\/\// {
    # Check not inside string
    comment_lines++
    # Skip rest of line processing for this line
    next
}

# Track strings (simple, no escape handling)
/"/ && !in_string {
    in_string = 1; string_char = "\""
    next
}
/'/ && !in_string {
    in_string = 1; string_char = "'"
    next
}
in_string == 1 && string_char == "\"" && /"/ { in_string = 0; next }
in_string == 1 && string_char == "'" && /'/ { in_string = 0; next }

# Count functions (simplified — matches function declarations)
in_string == 0 && /function[[:space:]]/ {
    f++
    if (/async[[:space:]]*function/) a++
}
# Arrow functions
in_string == 0 && /=>/ { f++ }
/async[[:space:]]*\(.*\)/ { if (!/=>/) a++ }

# Count exports
/export[[:space:]]/ { e++ }
/^export[[:space:]]/ { e++ }

# Count classes
/class[[:space:]]/ { c++ }

# Count code lines
/[^[:space:]]/ { code_lines++ }
# Empty lines or only whitespace
/^[[:space:]]*$/ { next }

END {
    if (file_count > 0) {
        printf "%s: funcs=%d async=%d exports=%d classes=%d comments=%d%%\n", prev_file, f, a, e, c, pct
        total_funcs += f; total_async += a; total_exports += e
        total_classes += c; total_comments += comment_lines
        total_code += code_lines
    }
    printf "\n=== JS Metrics Summary ===\n"
    printf "Files: %d\n", file_count
    printf "Total functions: %d\n", total_funcs
    printf "Total async functions: %d\n", total_async
    printf "Total exports: %d\n", total_exports
    printf "Total classes: %d\n", total_classes
    total_lines = total_comments + total_code
    if (total_lines > 0) {
        printf "Comment density: %d%%\n", int(total_comments * 100 / total_lines)
    }
}
