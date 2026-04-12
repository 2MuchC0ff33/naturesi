h50872
s 00018/00000/00000
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
# scripts/jq/categories-to-json.jq — Convert categories.txt to categories.json
# Usage: cat data/categories.txt | awk -f scripts/awk/categories-to-json.awk | jq -Rn 'fromjson'
# Or:  awk -f scripts/awk/categories-to-json.awk data/categories.txt > assets/js/data/categories.json

BEGIN {
    FS = "|"
    print "["
    first = 1
}

/^[^#]/ && NF >= 3 {
    if (!first) print ","
    first = 0
    gsub(/"/, "\\\"", $2)
    gsub(/"/, "\\\"", $3)
    printf "  {\"slug\": \"%s\", \"label\": \"%s\", \"href\": \"%s\"}", $1, $2, $3
}
E 1
