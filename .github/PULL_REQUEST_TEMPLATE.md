# Summary

Describe the changes in this PR and the problem it solves.

## Checklist

- [ ] I have run linters and formatters
- [ ] I have validated HTML and JSON where relevant
- [ ] I have tested locally (see testing notes below)
- [ ] This change does not affect payments or cart flow, or I have requested manual review if it does

Manual review required: changes touching `pages/store.html`, `products.json` or `/add-to-cart` MUST NOT be merged without 2MuchC0ff33 approval.

## Testing notes

1. Start the local server: Run the VS Code task "Serve (httpd)" or run your httpd that serves the project root at <http://localhost>
2. Open <http://localhost> and exercise the changed behaviour
3. For service-worker changes, test install/uninstall flows on localhost and verify caches are cleared when expected

## Related issues

Closes: #

---

Please include any additional notes for reviewers and any special deployment steps.
