# Architecture

## Overview

Runtime Inspector is a popup-only Manifest V3 extension. It contains no
background worker, persistent content script, remote code, or website-specific
integration.

## Components

### Popup

The popup owns the complete user workflow:

1. The user clicks **Inspect**.
2. The popup obtains the active tab identifier.
3. Chrome temporarily grants access through `activeTab`.
4. `chrome.scripting.executeScript` invokes the collector in the isolated
   world.
5. The returned report remains only in popup memory.
6. The user may export or copy the deterministic JSON serialization.

Closing the popup discards the report.

### Inspector

`inspectPage` is deliberately self-contained because a function passed to
`chrome.scripting.executeScript` cannot depend on lexical closures.

The inspector only reads selected browser, document, media, storage-name, DOM,
and performance properties. It does not write DOM properties, dispatch events,
call page APIs, call network APIs, subscribe to ongoing activity, intercept
application behavior, or enter the main JavaScript world.

### Serializer

`stableStringify` recursively sorts object keys, preserves array order,
normalizes non-finite numbers to `null`, and emits a final newline. Reports
contain no timestamp or generated identifier.

## Trust boundaries

```text
User gesture
    |
    v
Extension popup
    |
    | activeTab + scripting
    v
Chrome isolated world
    |
    | read-only return value
    v
Extension popup memory
    |
    +--> report.json
    |
    +--> clipboard
```

## Why ESBuild

The project has one TypeScript entry point, static HTML/CSS, and no framework.
ESBuild provides minimal configuration, no development server, no runtime
dependency, deterministic extension output, and substantially fewer
dependencies than a general application bundler.

## Determinism

Determinism means a fixed schema, sorted object keys, sorted storage/database
names, stable resource-type keys, no timestamp, no random values, and valid
JSON numbers. Live measurements such as playback position and resource counts
naturally reflect the page state at inspection time.
