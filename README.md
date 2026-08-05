# runtime-inspector

A standalone, open-source Chrome extension for exporting privacy-preserving,
read-only runtime diagnostics from pages the user has opened themselves.

Runtime Inspector is not browser automation, application instrumentation, or a
reverse-engineering tool.

## Principles

- Read-only
- User initiated
- No host permissions
- No persistent content script
- No background worker
- No network interception
- No storage values
- No remote code
- Deterministic JSON serialization

## Features

The report includes browser and platform information, privacy-normalized URL
information, conservatively redacted page-title information, document
visibility, selected Web API availability, Media Session support, audio element
state, localStorage and sessionStorage key names, IndexedDB database names,
worker support, DOM counts, performance resource counts, and network API
availability.

It never intentionally includes cookies, tokens, passwords, authorization
headers, storage values, database records, request or response data, DOM text,
media URLs, or form values.

## User interface

The popup contains exactly three actions:

- **Inspect**
- **Export JSON**
- **Copy JSON**

## Permissions

| Permission | Purpose |
| --- | --- |
| `activeTab` | Grants temporary access only after the user invokes the extension |
| `scripting` | Runs the read-only inspector in Chrome's isolated world |
| `clipboardWrite` | Copies generated JSON after a user click |

The extension has no host permissions.

## Build

Requirements:

- Node.js 22 or later
- pnpm 10 or later

```bash
corepack enable
pnpm install
pnpm build
```

The unpacked extension is written to `dist/`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the `dist/` directory.
5. Open a regular web page.
6. Open the Runtime Inspector popup.
7. Select **Inspect**.
8. Export or copy the report.

## Validation

```bash
pnpm validate
```

This runs Prettier verification, ESLint, TypeScript strict checking, unit and
policy tests, and a production build.

## Report schema

The canonical JSON Schema is `schema/report.schema.json`. An example report is
available at `examples/report.json`.

Top-level sections:

```text
schemaVersion
environment
runtime
media
storage
workers
performance
network
dom
summary
```

## Privacy normalization

To prevent accidental personal-data export, query strings and fragments are
never exported, URL path segment contents are replaced by `:segment`, page
title text is normally redacted, sensitive or identifier-like storage names
are omitted, only resource categories and counts are exported, and no
timestamps are included.

See [docs/privacy.md](docs/privacy.md).

## Architecture

The popup invokes a self-contained collector through
`chrome.scripting.executeScript`. The collector runs in the isolated world and
returns one read-only snapshot. The report remains in popup memory until it is
copied, exported, replaced, or the popup closes.

See [docs/architecture.md](docs/architecture.md).

## Known limitations

- Chrome internal pages, the Chrome Web Store, and other restricted pages
  cannot be inspected.
- File URL access depends on the user's extension settings.
- Sandboxed or storage-restricted pages may report storage as inaccessible.
- IndexedDB name enumeration depends on browser support.
- Page title text is intentionally redacted in most cases.
- Actual URL paths are intentionally not exported.
- Storage-name filtering can hide legitimate diagnostic names.
- Audio timing and performance counts reflect live page state.
- Only the first 100 audio elements are included in detail.

## Security review

The independent self-review is documented in `docs/self-review.md`.

## License

MIT
