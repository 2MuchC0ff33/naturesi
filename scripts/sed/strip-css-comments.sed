#!/bin/sh
# scripts/sed/strip-css-comments.sed — Remove CSS block comments
# Usage: sed -f scripts/sed/strip-css-comments.sed file.css > output.css
# Removes all /* ... */ blocks including multi-line

/\/\*/{
    :loop
    s/\/\*.*\*\///
    t done
    N
    b loop
    :done
}
