# Privacy model

Runtime Inspector is local-only and read-only.

## Data minimization

The report never intentionally includes cookies, cookie names, storage values,
database records, request URLs, response URLs, headers, request bodies,
response bodies, passwords, authorization data, media source URLs, DOM text,
form values, service worker registrations, or Cache Storage names and contents.

## URL handling

The report keeps only the origin, number of path segments, a structural path
template, and booleans indicating whether query and fragment components exist.
Actual path segments, query strings, and fragments are discarded.

## Title handling

Page titles may contain names, messages, document names, or account data. The
extension exports title text only when it exactly matches the current hostname
or its first hostname label. Other title text is discarded while retaining
only availability and length.

## Storage handling

Only names are considered. Names are omitted when they contain
credential-related words, contain account or user identifiers, contain email
markers, resemble UUIDs, contain long numeric identifiers, resemble long
hexadecimal or encoded values, contain non-ASCII characters, or exceed the
size limit. Aggregate and redaction counts remain available.

## Network behavior

The extension makes no network requests. It checks only whether browser
constructors such as `fetch`, `WebSocket`, `XMLHttpRequest`, and `EventSource`
are available.

## Persistence

Reports are stored only in popup memory. The project requests no extension
storage permission.
