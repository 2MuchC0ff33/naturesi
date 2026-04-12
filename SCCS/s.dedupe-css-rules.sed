h59824
s 00011/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh
# scripts/sed/dedupe-css-rules.sed — Remove duplicate CSS rules (keep first)
# Usage: sed -f scripts/sed/dedupe-css-rules.sed file.css > output.css
# Simple version: removes exact duplicate rule lines
# For full deduplication of multi-line rules, use awk version

# This is a simplified approach: tracks seen selectors and removes exact duplicates
# A proper solution would need awk to handle multi-line rule blocks

# For now, just flag potential duplicates by prefixing with DUP:
# This is a marker for further processing, not a full solution
E 1
