# Plugin submission

Thanks for contributing a plugin to the UnDercontrol registry. CI and a human reviewer
both read this PR, so fill in every field.

## What this PR adds / changes

- Plugin id:
- Version:

## Required

- [ ] **Source repository** — the public source the committed artifact was built from:

  <!-- link here -->

- [ ] **Reproducible build command** — the exact commands that regenerate
  `plugins/<id>/<id>.html` from that source (the reviewer runs these; the committed
  artifact is minified and cannot be read directly):

  ```
  # e.g. npm ci && npm run build
  ```

- [ ] **Declared file extensions** this plugin renders — must match `extensions` in
  `plugins.json`:

  ```
  # e.g. .ipynb
  ```

- [ ] I rebuilt the artifact and the `sha256` and `size` in `plugins.json` match the
  committed file.
- [ ] The plugin is ONE self-contained `.html` file that loads nothing over the network.

## What CI enforces (must be green to merge)

`plugins.json` is valid JSON and conforms to `schema/plugins.schema.json`; every entry's
`sha256` and `size` match its file; the file is a single `.html` under 2 MiB; ids are
unique; and no id is in both `plugins` and `removed`.

## What the hash protects — and what it does not

The `sha256` in the manifest guarantees that the bytes a user installs are exactly the
bytes in this PR's diff. It is anti-tamper for transport and for any future mirror.

**It does not make the code safe.** Malicious code ships with a perfectly correct hash,
so the hash protects nothing against a hostile author. The one thing between a user and
hostile plugin code is this review:

- the reviewer reads the **source** (not the minified artifact — that is why a
  reproducible build command is mandatory) for the two known sandbox gaps
  (self-navigation and WebRTC exfiltration) and for misleading UI;
- merge is publish — there is no second gate after this.

In one line: **sha256 is CI's job, trusting the code is the reviewer's.**
