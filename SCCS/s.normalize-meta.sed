h57625
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
# scripts/sed/normalize-meta.sed — Collapse multi-line meta tags in HTML
# Usage: sed -f scripts/sed/normalize-meta.sed file.html > output.html
# Fixes Tidy-generated multi-line:
#   <meta name="description" content=
#   "Perth-based Naturopath's...">
# Becomes:
#   <meta name="description" content="Perth-based Naturopath's...">

# Step 1: Collapse any sequence of whitespace followed by a double-quote
# This handles content="value" where there may be newlines/tabs between = and "
/=$/{
    N
    s/=\n[[:space:]]*"/="/
}

/=$/{
    N
    s/=\n[[:space:]]*"/="/
}
E 1
