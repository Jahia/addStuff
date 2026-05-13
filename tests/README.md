# AddStuff — Cypress Test Suite

End-to-end tests for the [AddStuff](https://github.com/Jahia/addStuff) Jahia module.
Tests run against a live Jahia instance and verify that the `jmix:addStuff` render filter
correctly injects custom HTML at four positions in rendered pages, at both site level and
page level, and that the React/Moonstone settings panel works end-to-end.

---

## Table of contents

- [Requirements](#requirements)
- [Quick start with Docker](#quick-start-with-docker)
- [Running against an existing Jahia instance](#running-against-an-existing-jahia-instance)
- [Environment variables](#environment-variables)
- [Running the tests](#running-the-tests)
- [Generating reports](#generating-reports)
- [Project structure](#project-structure)
- [Shared helpers](#shared-helpers)
- [Test coverage](#test-coverage)

---

## Requirements

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | **18.x** | 20.x recommended |
| Yarn | 1.22.x | Classic (v1) |
| Docker | any recent | Only needed for the Docker workflow |
| Jahia | **8.2.3.0** EE | License required — see below |

---

## Quick start with Docker

This is the recommended workflow when you don't have a Jahia instance already running.

### 1 — Build the module JAR

```bash
cd ..
mvn clean install
cd tests
```

This produces `../target/addstuff-<version>.jar`.

### 2 — Install dependencies

```bash
yarn install --ignore-engines
```

> `--ignore-engines` is required on Node 18, which is below Cypress's stated minimum of Node 20.
> The tests run correctly on Node 18 in practice.

### 3 — Configure your environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
JAHIA_LICENSE=<base64-encoded license>   # required
JAHIA_IMAGE=ghcr.io/jahia/jahia-ee-dev:8.2.3.0  # or your target version
SUPER_USER_PASSWORD=root1234
```

The license can be provided as a base64-encoded string in `JAHIA_LICENSE`, or as a plain XML
file at `/tmp/license.xml` — `ci.startup.sh` encodes it automatically if the env var is absent.

To encode an existing license file:

```bash
export JAHIA_LICENSE=$(base64 -i /path/to/license.xml)
```

### 4 — Copy the JAR into the assets folder

```bash
./ci.build.sh
```

This copies the latest `addstuff-*.jar` from `../target/` into `assets/` so the Jahia
provisioning manifest can find it at startup.

### 5 — Start Jahia

```bash
./ci.startup.sh
```

This starts the `jahia` service defined in `docker-compose.yml` on port **8080** (and 8000
for JPDA remote debugging). It then waits for Jahia to be fully ready before returning.

To start Jahia without immediately running the tests, pass `notests`:

```bash
./ci.startup.sh notests
```

### 6 — Run the tests

```bash
yarn e2e:ci        # headless
yarn e2e:debug     # with the Cypress interactive UI
```

### Stopping Jahia

```bash
docker-compose down
```

---

## Running against an existing Jahia instance

If you already have a Jahia instance running (local or remote):

```bash
cp .env.example .env
# edit .env: set JAHIA_URL, SUPER_USER_PASSWORD
yarn install --ignore-engines
yarn e2e:ci
```

The `01-Tests.cy.ts` spec automatically deploys the `empty-templates` module and the
addstuff JAR via the Jahia provisioning API. Make sure the JAR has been built first:

```bash
cd .. && mvn clean install && cd tests
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JAHIA_URL` | `http://localhost:8080` | Base URL of the Jahia instance |
| `SUPER_USER_PASSWORD` | `root1234` | Password for the `root` superuser |
| `MODULE_ID` | `addstuff` | Module identifier used by provisioning |
| `JAHIA_IMAGE` | `ghcr.io/jahia/jahia-ee-dev:8.2.3.0` | Docker image to pull |
| `JAHIA_VERSION` | `8.2.3.0` | Jahia version (informational) |
| `JAHIA_LICENSE` | _(none)_ | Base64-encoded Jahia EE license |

---

## Running the tests

### Headless / CI

```bash
yarn e2e:ci
```

### Interactive (Cypress UI)

```bash
yarn e2e:debug
```

### Single spec

```bash
yarn e2e:ci --spec "cypress/e2e/02-site-injection.cy.ts"
```

Specs are numbered to enforce run order. **01** creates the `addstufftest` site and test
pages; **99** deletes them. Always run the full suite unless you know the site already exists.

> **Important:** `01-Tests.cy.ts` must complete successfully before any individual spec can
> run in isolation — it creates the `addstufftest` site and the two test pages that every
> other spec depends on.

---

## Generating reports

After a `yarn e2e:ci` run, reports land in `results/reports/`. Merge and render them with:

```bash
yarn report:merge   # merge per-spec JSON files into results/reports/report.json
yarn report:html    # render results/reports/report.html
```

---

## Project structure

```
tests/
├── assets/                          # JARs deployed to Jahia at startup
│   └── addstuff-<version>.jar       # copied here by ci.build.sh
├── cypress/
│   ├── e2e/                         # Spec files (run in numbered order)
│   │   ├── 01-Tests.cy.ts           # Infrastructure: deploy, site creation, sanity
│   │   ├── 02-site-injection.cy.ts  # Site-level injection (jnt:virtualsite)
│   │   ├── 03-page-injection.cy.ts  # Page-level injection (jnt:page, sub-page)
│   │   ├── 04-combined-injection.cy.ts  # Site + page injection simultaneously
│   │   ├── 05-home-page-injection.cy.ts # jmix:addStuff on the home jnt:page node
│   │   ├── 06-ui-settings.cy.ts     # React/Moonstone settings panel smoke tests
│   │   └── 99-teardown.cy.ts        # Delete addstufftest site
│   ├── fixtures/
│   │   ├── graphql/addstuff/
│   │   │   ├── addAddStuffMixin.graphql       # Step 1: add mixin to a node
│   │   │   └── setAddStuffProperties.graphql  # Step 2: set the four injection fields
│   │   ├── groovy/addstuff/
│   │   │   └── flushHtmlCache.groovy          # Flush all Jahia HTML cache instances
│   │   └── modules/
│   │       └── empty-templates-1.0.0.jar      # Template set deployed by test 01
│   ├── plugins/
│   │   └── index.js                 # Cypress plugin registration (@jahia/cypress)
│   └── support/
│       ├── addstuff.ts              # Shared helpers (see table below)
│       └── e2e.js                   # Global Cypress setup
├── docker-compose.yml               # Jahia service definition
├── ci.build.sh                      # Copy JAR from ../target/ into assets/
├── ci.startup.sh                    # Start Jahia and wait for readiness
├── env.run.sh                       # Run @jahia/cypress env readiness check
├── set-env.sh                       # Source .env into shell
├── cypress.config.ts
├── .env.example
├── reporter-config.json
└── package.json
```

---

## Shared helpers

All helpers are exported from `cypress/support/addstuff.ts`.

| Helper | Purpose |
|--------|---------|
| `pageUrl(name)` | Live URL for a sub-page: `/sites/addstufftest/home/<name>.html` |
| `homeUrl()` | Live URL for the home page: `/sites/addstufftest/home.html` |
| `adminSettingsUrl()` | Admin panel URL: `/jahia/administration/addstufftest/addStuffSiteSettings` |
| `pageUrlDefault(name)` | Default-workspace URL (authenticated only, for debugging) |
| `deployEmptyTemplates()` | Install `empty-templates` via provisioning API (no-op if already present) |
| `deployAddStuffModule()` | Install the addstuff JAR from `../target/` via provisioning API |
| `createTestSite()` | Create the `addstufftest` site with the `empty-templates` template set |
| `deleteTestSite()` | Delete the `addstufftest` site |
| `createTestPage(name)` | Add a `jnt:page` node under `/sites/addstufftest/home` |
| `publishNode(pathOrId, opts?)` | Publish a node to the live workspace. `opts.includeSubTree` (default `true`), `opts.waitMs` (default `3000`). Always call explicitly — autopublish timing is non-deterministic. |
| `applyAddStuff(pathOrId, props)` | Add `jmix:addStuff` mixin and set the four injection properties. Uses two sequential GraphQL calls to guarantee the mixin exists before properties are written. |
| `setCodeMirrorValue(index, value)` | Set the value of a CodeMirror editor by its DOM index (0–3) via the CodeMirror JS API. Works within `cy.window().then(...)`. Note: `cm.save()` does not exist in direct-attach mode — `setValue()` fires the `change` event directly. |
| `flushHtmlCache()` | Flush all Jahia HTML render caches via Groovy. Required after mutating the site node, which does not automatically invalidate page cache entries. |
| `waitForContent(page, marker, ms?)` | Poll the live page URL until `marker` appears in the response body (default 30 s, 2 s interval). Use after `flushHtmlCache()` instead of a fixed `cy.wait`. |

---

## Test coverage

### 01 — Infrastructure (`01-Tests.cy.ts`)

Deploys modules, creates the `addstufftest` site, and creates `test-page` and `other-page`.

- `addstuff` OSGi bundle is deployed and in `STARTED` state
- Both test pages return HTTP 200 in live mode
- Rendered pages contain `<head>` and `<body>` elements

### 02 — Site-level injection (`02-site-injection.cy.ts`)

Applies `jmix:addStuff` to `/sites/addstufftest` (a `jnt:virtualsite` node).

- All four markers (`addstuff-site-*`) are present on `test-page`
- `<head>` markers appear inside `<head>`, `<body>` markers appear inside `<body>`
- `addStuffHeadTop` appears before `addStuffHead` (ordering)
- `addStuffBodyTop` appears before `addStuffBody` (ordering)
- Markers also appear on `other-page` — site-level injection applies to all pages

### 03 — Page-level injection (`03-page-injection.cy.ts`)

Applies `jmix:addStuff` to `/sites/addstufftest/home/test-page` (a `jnt:page` sub-page).

- All four markers (`addstuff-page-*`) are present on `test-page`
- Those markers are **absent** on `other-page` — scoped to the configured page only

### 04 — Combined injection (`04-combined-injection.cy.ts`)

No new setup — relies on state from tests 02 and 03.

- Site-level and page-level markers coexist on `test-page`
- `other-page` shows site-level markers but not page-level markers

### 05 — Home page injection (`05-home-page-injection.cy.ts`)

Applies `jmix:addStuff` directly to `/sites/addstufftest/home` — a `jnt:page` node, not a
sub-page. Validates that the mixin works on `jnt:page` as declared in the CND
(`extends = jnt:virtualsite, jnt:page`).

- All four markers (`addstuff-home-*`) appear when visiting the home page URL
- Those markers are **absent** on sub-pages — scoped to the home page only

### 06 — Settings UI (`06-ui-settings.cy.ts`)

Navigates to the React/Moonstone admin panel at `/jahia/administration/addstufftest/addStuffSiteSettings`.

- Panel loads with all 4 CodeMirror editors visible
- Save and Cancel buttons are present
- A value set via the CodeMirror JS API is saved and the Moonstone success feedback appears
- After publish and cache flush, the saved value appears on the live page
- Cancel reverts the editor content to the last saved value from the JCR

### 99 — Teardown (`99-teardown.cy.ts`)

Deletes the `addstufftest` site.

---

## License

MIT — see the [LICENSE.txt](../LICENSE.txt) file at the root of the repository.
