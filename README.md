# ud-registry

Distribution repository for UnDercontrol plugins and skills. This public repository is
the single source of truth that UnDercontrol clients pull from to browse and install
plugins (resource renderers) and, in the future, shareable skill text.

## Layout

```
plugins.json            Plugin manifest (clients fetch this)
plugins/<id>/<id>.html  Plugin build artifact, one directory per plugin
skills/                 Shareable skill text (placeholder, future use)
.github/                PR template + CI validation
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
3. Open a PR.

Each manifest entry carries a `sha256` that the installing client verifies, so the PR
diff is the exact bytes that get distributed. The full PR template and the CI checks that
every PR must pass (schema validity, `sha256` match, single-file HTML, size limit, unique
id) are delivered by a follow-up change; this commit establishes the repository and its
layout.
