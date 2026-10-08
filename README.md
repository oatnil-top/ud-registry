# ud-registry

Distribution repository for UnDercontrol plugins and skills. This public repository is
the single source of truth that UnDercontrol clients pull from to browse and install
plugins (resource renderers) and, in the future, shareable skill text.

## Layout

```
plugins.json                  Plugin manifest (clients fetch this)
plugins/<id>/<id>.html        Plugin build artifact, one directory per plugin
schema/plugins.schema.json    JSON Schema for plugins.json (used by CI)
scripts/validate-manifest.mjs CI validator
skills/                       Shareable skill text (placeholder, future use)
.github/                      PR template + CI workflow
```

Clients fetch `plugins.json` over `raw.githubusercontent.com` (which serves
`access-control-allow-origin: *`), browse the list, and install with one click: download
the artifact, verify its `sha256` against the manifest, then store it as the user's own
resource.

## Submitting a plugin

External authors contribute by pull request:

1. Fork this repository.
2. Add your plugin build artifact under `plugins/<id>/<id>.html` and a corresponding
   entry in `plugins.json`.
3. Open a PR — the pull request template walks you through what to fill in.

Each manifest entry carries a `sha256` that the installing client verifies, so the PR
diff is the exact bytes that get distributed. CI (`.github/workflows/validate.yml`) must
be green to merge; it runs `scripts/validate-manifest.mjs`, which checks that
`plugins.json` conforms to `schema/plugins.schema.json`, that every entry's `sha256` and
`size` match its file, that the file is a single self-contained `.html` under 2 MiB, that
ids are unique, and that no id is in both `plugins` and `removed`.

The `sha256` guards the bytes in transit and in any mirror; it does **not** make the code
safe — malicious code ships with a correct hash. Trusting the code is what review is for
(reviewers read the source, which is why a reproducible build command is required), and
merge is publish. See `.github/PULL_REQUEST_TEMPLATE.md`.

To validate locally: `npm ci && npm run validate`.
