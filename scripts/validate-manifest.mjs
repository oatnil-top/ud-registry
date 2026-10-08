// CI gate for plugins.json. Every PR must pass this (.github/workflows/validate.yml).
// Checks: the manifest is valid JSON and conforms to schema/plugins.schema.json; each
// entry's sha256 and size match its file; the file is a single self-contained .html
// under 2 MiB; ids are unique; and no id appears in both plugins[] and removed[].
//
// What the sha256 check does NOT do: it guarantees the installed bytes equal the bytes
// in the PR diff (anti-tamper for transport and mirrors), but it cannot tell safe code
// from malicious code with a correct hash. That is review's job, not CI's — see
// .github/PULL_REQUEST_TEMPLATE.md.
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BYTES = 2 * 1024 * 1024; // 2 MiB hard cap on a plugin HTML file

const errors = [];
const fail = (msg) => errors.push(msg);

// --- load the manifest ---
let manifest;
try {
  manifest = JSON.parse(readFileSync(resolve(repoRoot, 'plugins.json'), 'utf8'));
} catch (e) {
  console.error(`plugins.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

// --- schema conformance ---
const schema = JSON.parse(readFileSync(resolve(repoRoot, 'schema/plugins.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  for (const e of validate.errors) fail(`schema: ${e.instancePath || '(root)'} ${e.message}`);
}

// --- per-plugin file checks ---
const seen = new Set();
for (const p of Array.isArray(manifest.plugins) ? manifest.plugins : []) {
  const where = `plugin "${p.id}"`;
  if (seen.has(p.id)) fail(`${where}: duplicate id`);
  seen.add(p.id);

  // file path convention ties the artifact to the id: plugins/<id>/<id>.html
  const expected = `plugins/${p.id}/${p.id}.html`;
  if (p.file !== expected) {
    fail(`${where}: file must be "${expected}", got "${p.file}"`);
    continue;
  }

  let bytes;
  try {
    const st = statSync(resolve(repoRoot, p.file));
    if (!st.isFile()) { fail(`${where}: ${p.file} is not a regular file`); continue; }
    bytes = readFileSync(resolve(repoRoot, p.file));
  } catch {
    fail(`${where}: ${p.file} does not exist`);
    continue;
  }

  if (bytes.length !== p.size) fail(`${where}: size ${p.size} != actual ${bytes.length}`);
  if (bytes.length > MAX_BYTES) fail(`${where}: ${bytes.length} bytes exceeds the ${MAX_BYTES}-byte (2 MiB) cap`);

  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== p.sha256) fail(`${where}: sha256 mismatch\n      manifest ${p.sha256}\n      actual   ${sha}`);

  // single-file HTML: looks like an HTML document and loads nothing over the network
  const text = bytes.toString('utf8');
  if (!/<html[\s>]/i.test(text)) fail(`${where}: ${p.file} does not look like an HTML document`);
  if (/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']?https?:/i.test(text)) {
    fail(`${where}: ${p.file} references an external http(s) resource — a plugin must be one self-contained file`);
  }
}

// --- removed[] invariants ---
const seenRemoved = new Set();
for (const r of Array.isArray(manifest.removed) ? manifest.removed : []) {
  if (seenRemoved.has(r.id)) fail(`removed: duplicate id "${r.id}"`);
  seenRemoved.add(r.id);
}
for (const id of seen) {
  if (seenRemoved.has(id)) fail(`id "${id}" is in both plugins[] and removed[]`);
}

if (errors.length) {
  console.error(`plugins.json validation FAILED (${errors.length} problem(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`plugins.json OK: ${seen.size} plugin(s), ${seenRemoved.size} removed.`);
