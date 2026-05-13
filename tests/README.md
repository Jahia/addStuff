# AddStuff — Cypress Test Suite

End-to-end tests for the [AddStuff](https://github.com/Jahia/addStuff) Jahia module.
Tests run against a live Jahia instance and verify that the `jmix:addStuff` render filter
correctly injects custom HTML into the `<head>` and `<body>` of rendered pages at both
site level and page level.

---

## Requirements

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | **18.x** | 20.x also supported |
| Yarn | 1.22.x | Classic (v1) |
| Jahia | 8.2.3.0 | EE, with `addstuff` module deployed |
| Template set | `bootstrap5-templates-starter` | Required to render test pages |

> The `addstuff` OSGi bundle must be deployed and active before running the tests.
> `createTestSite()` automatically enables the module on the test site via `enableModule`.

---

## Environment variables

Copy `.env.example` to `.env` and adjust for your environment:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `JAHIA_URL` | `http://localhost:8080` | Base URL of the Jahia instance |
| `SUPER_USER_PASSWORD` | `root1234` | Password for the `root` superuser |
| `MODULE_ID` | `addstuff` | Module identifier |
| `JAHIA_IMAGE` | `ghcr.io/jahia/jahia-ee-dev:8.2.3.0` | Docker image (CI only) |
| `JAHIA_VERSION` | `8.2.3.0` | Jahia version |

---

## Installation

```bash
cd tests
yarn install --ignore-engines
```

> `--ignore-engines` is required when running on Node 18, which is below Cypress 15's stated
> requirement of Node 20. The tests run fine on Node 18 in practice.

---

## Running the tests

### Interactive mode (headed, with Cypress UI)

```bash
yarn e2e:debug
```

### Headless / CI mode

```bash
yarn e2e:ci
```

Specs are numbered to enforce run order — **01** sets up the test site, **99** tears it down.

> **Important:** `01-Tests.cy.ts` must have run at least once before executing any individual
> spec in isolation. It creates the `addstufftest` site and the two test pages that every
> other test depends on.

---

## Project structure

```
tests/
├── cypress/
│   ├── e2e/                    # Spec files (run in numbered order)
│   ├── fixtures/
│   │   └── graphql/addstuff/
│   │       └── applyAddStuff.graphql   # Custom mutation: mixin + all 4 properties
│   ├── plugins/
│   │   └── index.js            # Cypress plugin registration (@jahia/cypress)
│   └── support/
│       ├── addstuff.ts         # Shared helpers
│       └── e2e.js              # Global Cypress setup
├── cypress.config.ts
├── .env.example
└── package.json
```

> All standard Jahia fixtures (`graphql/jcr/mutation/*.graphql`, `groovy/admin/*.groovy`, etc.)
> are loaded automatically from the `@jahia/cypress` package via its built-in fallback mechanism.
> Only `applyAddStuff.graphql` is project-specific.

### Shared helpers (`support/addstuff.ts`)

| Helper | Purpose |
|--------|---------|
| `pageUrl(name, lang?)` | Build the live render URL for a test page |
| `createTestSite()` | Create the `addstufftest` site with `bootstrap5-templates-starter` |
| `deleteTestSite()` | Delete the `addstufftest` site |
| `createTestPage(name)` | Add a `jnt:page` under `/home` |
| `publishNode(pathOrId)` | Publish a node and its subtree (includes a 3 s propagation wait). Not needed for the site node — `jnt:virtualsite` is autopublished. |
| `applyAddStuff(pathOrId, props)` | Apply `jmix:addStuff` mixin + set the four injection properties on any existing node |

---

## How the module works

The `AddStuff` render filter (`priority 16.5`, modes `live` and `preview`) intercepts the
final HTML output of every page request. For each page it checks both the **site node** and
the **current page node** for the `jmix:addStuff` mixin. When the mixin is present it uses
the Jericho HTML parser to inject the property values at four exact positions:

| Property | Injection point |
|----------|----------------|
| `addStuffHeadTop` | Immediately after the opening `<head>` tag |
| `addStuffHead` | Immediately before the closing `</head>` tag |
| `addStuffBodyTop` | Immediately after the opening `<body>` tag |
| `addStuffBody` | Immediately before the closing `</body>` tag |

Both levels are additive — if both the site and a page have the mixin, both sets of content
are injected on that page.

---

## Test coverage

### 01 — Infrastructure (`01-Tests.cy.ts`)
Creates the `addstufftest` site and two pages (`test-page`, `other-page`).

- Both pages return HTTP 200 in live mode
- Rendered pages have a `<head>` and a `<body>` element

### 02 — Site-level injection (`02-site-injection.cy.ts`)
Applies `jmix:addStuff` to the site node with unique markers at all four injection points.

- All four markers are present on `test-page`
- `<head>` markers are inside `<head>`, `<body>` markers are inside `<body>`
- `addStuffHeadTop` appears before `addStuffHead` in the DOM (ordering)
- `addStuffBodyTop` appears before `addStuffBody` in the DOM (ordering)
- Site-level markers also appear on `other-page` (applies to all pages)

### 03 — Page-level injection (`03-page-injection.cy.ts`)
Applies `jmix:addStuff` to `test-page` only.

- All four page-specific markers are present on `test-page`
- Those markers are **absent** on `other-page` (scoped to the configured page)

### 04 — Combined injection (`04-combined-injection.cy.ts`)
No new setup — relies on state left by tests 02 and 03.

- Both site-level and page-level markers coexist on `test-page` (the filter processes both nodes simultaneously)
- `other-page` shows site-level markers but not page-level markers

### 99 — Teardown (`99-teardown.cy.ts`)
Deletes the `addstufftest` site.

---

## License

MIT — see the [LICENSE.txt](../LICENSE.txt) file at the root of the repository.
