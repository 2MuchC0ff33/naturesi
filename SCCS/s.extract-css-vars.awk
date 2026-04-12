h64061
s 00049/00000/00000
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
# scripts/awk/extract-css-vars.awk — Extract CSS custom property definitions
# Usage: awk -f scripts/awk/extract-css-vars.awk assets/css/partials/**/*.css
# Output: sorted, deduplicated list of --var names
# Example: awk -f scripts/awk/extract-css-vars.awk assets/css/partials/settings/variables.css

BEGIN {
    # Track seen variables to deduplicate
    seen_count = 0
}

# Match CSS custom property definitions: --var-name: value
# Handles: --var: value, --var:value, --var:  value
/--[a-zA-Z0-9_-]+[[:space:]]*:[[:space:]]/ {
    # Extract the variable name (everything before the colon, stripped of whitespace)
    # Remove leading whitespace
    gsub(/^[[:space:]]+/, "")
    # Find the colon position
    colon = index($0, ":")
    if (colon > 0) {
        var_name = substr($0, 1, colon - 1)
        # Remove any leading whitespace from var_name
        gsub(/^[[:space:]]+/, "", var_name)
        # Remove trailing whitespace
        gsub(/[[:space:]]+$/, "", var_name)
        # Only process if it starts with --
        if (substr(var_name, 1, 2) == "--") {
            if (!seen[var_name]++) {
                vars[seen_count++] = var_name
            }
        }
    }
}

END {
    # Sort the variables (simple bubble sort for portability)
    for (i = 0; i < seen_count - 1; i++) {
        for (j = i + 1; j < seen_count; j++) {
            if (vars[i] > vars[j]) {
                tmp = vars[i]
                vars[i] = vars[j]
                vars[j] = tmp
            }
        }
    }
    for (i = 0; i < seen_count; i++) {
        print vars[i]
    }
}
E 1
