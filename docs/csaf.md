# CSAF Provider Metadata and Advisory Structure

This repository exposes a minimal Common Security Advisory Framework (CSAF) feed
in accordance with the CSAF distribution requirements (sections 7.1.8–7.1.14).

## Files and directories

- `.well-known/security.txt` – must contain a `CSAF:` field pointing to
  `https://<domain>/.well-known/csaf/provider-metadata.json`.
- `.well-known/csaf/provider-metadata.json` – metadata describing our CSAF
  service.  Update the `last_updated` field whenever the file changes and
  adjust the publisher details as appropriate.
- `.well-known/csaf/<YYYY>/` – year folders containing advisory JSON files.
  Each advisory is a CSAF document whose `document.tracking.initial_release_date`
  year matches the folder name.
- `.well-known/csaf/<YYYY>/index.txt` – newline list of relative paths to all
  advisory JSONs in that year (relative to the csaf folder).
- `.well-known/csaf/<YYYY>/changes.csv` – CSV with two columns: filename and
  `document.tracking.current_release_date`.  Sorted by date, newest first.
  Do **not** include a header line; comments are allowed for humans.

## Publishing new advisories

1. Create a new `.json` file under the appropriate `YYYY/` directory.
2. Add its relative path to `index.txt` and a line to `changes.csv` with the
   current release date timestamp.
3. Commit and push; directory listings are enabled by default when hosted as
   static content (e.g. GitHub Pages).

## Testing

A simple Node script `tests/check_csaf.js` validates the presence of the CSAF
field and ensures that the metadata file is valid JSON with required keys.  Run
it via:

```sh
node tests/check_csaf.js
```

## Notes

  domain; replace with the real host when deploying.
- If the publishing authority changes DNS, update the metadata accordingly and
  adjust any aggregator flags.
