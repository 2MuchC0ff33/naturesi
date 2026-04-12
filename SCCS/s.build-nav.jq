h35463
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
# scripts/jq/build-nav.jq — Generate navigation HTML from categories.json
# Usage: jq -f scripts/jq/build-nav.jq assets/js/data/categories.json
# Outputs: <li> HTML list items

def nav_item(cat):
  "<li><a href=\"\(cat.href)\">\(cat.label)</a></li>";

.categories |
  map(nav_item(.)) |
  join("\n")
E 1
