#!/bin/sh
# scripts/jq/build-nav.jq — Generate navigation HTML from categories.json
# Usage: jq -f scripts/jq/build-nav.jq assets/js/data/categories.json
# Outputs: <li> HTML list items

def nav_item(cat):
  "<li><a href=\"\(cat.href)\">\(cat.label)</a></li>";

.categories |
  map(nav_item(.)) |
  join("\n")
