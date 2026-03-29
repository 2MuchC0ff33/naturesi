#!/bin/sh
# scripts/sed/extract-urls.sed — Extract all URLs from HTML/CSS files
# Usage: sed -f scripts/sed/extract-urls.sed file.html
# Extracts: href="...", src="...", url(...)

# href attributes
s/href=["']\([^"']*\)["']/\1\n/g

# src attributes
s/src=["']\([^"']*\)["']/\1\n/g

# url(...) in CSS
s/url(\([^)]*\))/\1\n/g

# Background-image URLs
s/background-image:[[:space:]]*url(\([^)]*\))/\1\n/g
