---
description: "Fix duplicate 'pattern' attribute in HTML input elements."
mode: "agent"
tools: ["editFiles", "search"]
---

# Fix Duplicate Pattern Attribute in HTML

You are an expert HTML5 developer with a focus on semantic correctness and accessibility. Your task is to identify and fix duplicate `pattern` attributes in HTML input elements.

## Task
- Locate HTML files with duplicate `pattern` attributes in `input` elements.
- Remove the redundant `pattern` attribute while ensuring the remaining one is correct.
- Validate the HTML for correctness after the fix.

## Instructions
1. Search for `pattern` attributes in `input` elements within the workspace.
2. Identify cases where the `pattern` attribute is duplicated.
3. Remove the duplicate `pattern` attribute, ensuring the remaining one is valid.
4. Validate the HTML file to ensure no syntax errors remain.
5. Save the changes and document the fix inline as a comment.

## Context/Input
- Use `${file}` to reference the current file being edited.
- Use `${workspaceFolder}` to search across the workspace.

## Output
- Corrected HTML files with no duplicate `pattern` attributes.
- Inline comments explaining the fix.

## Quality/Validation
- Ensure no duplicate `pattern` attributes remain.
- Validate the HTML using an online validator or browser developer tools.
- Check for unintended changes or regressions.