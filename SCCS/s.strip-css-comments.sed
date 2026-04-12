h31505
s 00013/00000/00000
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
E 1
