h41453
s 00016/00000/00000
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
E 1
