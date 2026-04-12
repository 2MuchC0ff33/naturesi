#!/bin/sh
# scripts/jq/ftp-list-parser.jq — Parse FTP MLSD/MLST output to JSON
# Purpose: Convert raw FTP directory listing to structured JSON
# Usage: curl --quote "MLSD /path" ftp://host | jq -f scripts/jq/ftp-list-parser.jq
# Output: JSON array of {path, size, type, modify}

# Parse MLSD facts (key=value pairs)
def parse_facts:
  split(";") | map(
    if contains("=") then
      split("=") | {key: .[0] | ascii_downcase, value: .[1]}
    else empty
    end
  ) | from_entries
;

# Parse each line of MLSD output
def parse_entry:
  if startswith("type=cdir") or startswith("type=pdir") then
    empty  # Skip current/parent directory entries
  else
    parse_facts as $facts |
    {
      type: ($facts.type // "file"),
      path: ($facts.ptly // ""),
      size: ($facts.size | tonumber? // 0),
      modify: ($facts.modify // "")
    }
  end
;

# Main: split by newlines and parse each
split("\n") | map(select(length > 0)) | map(parse_entry) | compact
