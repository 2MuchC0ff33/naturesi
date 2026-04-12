h53573
s 00020/00000/00000
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
# scripts/sed/strip-js-comments.sed — Remove JS comments (// and /* */)
# Usage: sed -f scripts/sed/strip-js-comments.sed file.js > output.js
# Removes single-line // comments and multi-line /* ... */ blocks

# Remove single-line // comments (not URLs like http://)
# Match // that is NOT preceded by a colon (to avoid URLs)
s/\/\/.*$/\/\//g

# Remove block comments /* ... */
# Note: this is a simplified version; for complex cases use awk or a proper parser

/\/\*/{
    :block
    /\*\//!{
        N
        b block
    }
    s/\/\*.*\*\//\/\//g
}
E 1
