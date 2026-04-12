h40899
s 00016/00000/00000
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
E 1
