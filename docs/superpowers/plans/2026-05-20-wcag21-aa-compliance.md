# WCAG 2.1 AA Compliance — Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the addStuff React admin panel compliant with WCAG 2.1 Level AA by upgrading CodeMirror 5 → 6 and adding ARIA semantics, accessible labels, keyboard escape, contrast-safe colours, and a live status region.

**Architecture:** CodeMirrorField.jsx is fully rewritten for the CM6 API (`@codemirror/*` packages) which natively uses a `contenteditable` div — far more screen-reader-friendly than CM5's hidden textarea. AddStuffSettings.jsx gains `role="group"` section grouping, `<label>` elements, `aria-live` status, a focus-restoration ref, and a contrast-safe help text colour. The `setCodeMirrorValue` Cypress helper is updated to use the CM6 transaction API.

**Tech Stack:** React 18, CodeMirror 6 (`@codemirror/*`), Moonstone 2, Cypress, TypeScript

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `package.json` | Modify | Remove `codemirror ^5`, add 6 `@codemirror/*` packages |
| `src/javascript/AddStuff/CodeMirrorField.jsx` | Rewrite | CM6 API, forward ARIA props, Escape-to-blur keymap, expose view on container for tests |
| `src/javascript/AddStuff/AddStuffSettings.jsx` | Modify | role="group", `<label>` elements, `aria-live` region, contrast fix, focus-restoration ref, Loader ARIA wrapper |
| `src/main/resources/javascript/locales/en.json` | Modify | Add `addstuff.loading` key |
| `tests/cypress/support/addstuff.ts` | Modify | Update `setCodeMirrorValue` for CM6; update Cancel test value-read for CM6 |
| `tests/cypress/e2e/06-ui-settings.cy.ts` | Modify | Update `.CodeMirror` selectors to `.cm-editor`; add 5 ARIA assertions |

**Not touched:** `src/main/resources/javascript/codemirror/` (serves Jahia Content Editor fieldset, separate context from admin panel).

---

## Task 1: Install CM6 dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json dependencies**

Replace the `codemirror` entry and add CM6 packages. Open `package.json` and change the `dependencies` block to:

```json
"dependencies": {
    "@codemirror/autocomplete": "^6.0.0",
    "@codemirror/commands": "^6.0.0",
    "@codemirror/lang-html": "^6.0.0",
    "@codemirror/language": "^6.0.0",
    "@codemirror/state": "^6.0.0",
    "@codemirror/view": "^6.0.0",
    "@jahia/moonstone": "^2.16.2",
    "@jahia/ui-extender": "^1.1.0",
    "i18next": "^21.6.14",
    "react": "^18.3.1",
    "react-i18next": "^11.18.6"
}
```

(`codemirror: ^5.65.0` is removed; `@codemirror/autocomplete` provides `closeBrackets`.)

- [ ] **Step 2: Install**

```bash
yarn install
```

Expected: no errors, `node_modules/@codemirror/view` directory exists.

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "feat(deps): replace CodeMirror 5 with CodeMirror 6"
```

---

## Task 2: Add loading translation key

**Files:**
- Modify: `src/main/resources/javascript/locales/en.json`

This key is needed by Task 3's Loader ARIA wrapper. Add it before implementing the component.

- [ ] **Step 1: Add `addstuff.loading` to en.json**

```json
{
    "addstuff": {
        "siteSettings": {
            "title": "Add Stuff",
            "description": "Add custom code snippets to every page of this site. Visible in preview and live modes only.",
            "saved": "Your stuff has been saved",
            "loading": "Loading settings…",
            "headTop": { "help": "Loaded before anything else. Ideal for tag managers (e.g. Google Tag Manager snippet)." },
            "head":    { "help": "Loaded before the page renders. Ideal for stylesheets, fonts, or meta tags." },
            "bodyTop": { "help": "First element inside the body. Ideal for GTM noscript fallback or cookie consent banners." },
            "body":    { "help": "Loaded after all page content. Ideal for analytics, chat widgets, or deferred scripts." },
            "notInstalled": "Add Stuff is not installed on this site."
        }
    },
    "jmix_addStuff": {
        "addStuffHeadTop": "Start of <head>",
        "addStuffHead":    "End of <head>",
        "addStuffBodyTop": "Start of <body>",
        "addStuffBody":    "End of <body>"
    },
    "label": {
        "save":   "Save",
        "cancel": "Cancel"
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/resources/javascript/locales/en.json
git commit -m "feat(i18n): add loading key for WCAG 4.1.2 Loader label"
```

---

## Task 3: Rewrite CodeMirrorField.jsx for CM6 + ARIA

**Files:**
- Rewrite: `src/javascript/AddStuff/CodeMirrorField.jsx`

> **Design note — fieldset vs role="group":** The spec says `<fieldset>/<legend>`. In practice, `<fieldset>` requires aggressive UA style resets and `<legend>` positioning hacks to match the existing section header visuals. `role="group" aria-labelledby` is the equivalent WCAG-accepted technique (ARIA17) for SC 1.3.1 and avoids visual breakage. The plan uses `role="group"`.

- [ ] **Step 1: Write the failing Cypress assertion (documents expected post-implementation state)**

Add a new `context` block to `tests/cypress/e2e/06-ui-settings.cy.ts`, inside `describe('AddStuff — Site settings UI', ...)`, after the existing contexts:

```typescript
context('Accessibility — WCAG 2.1 AA', () => {
    beforeEach(() => {
        cy.login()
        cy.visit(adminSettingsUrl())
        cy.get('.addstuff-cm-field').should('have.length', 4)
    })

    it('CM6 editors have aria-labelledby', () => {
        cy.get('.cm-editor').first().should('have.attr', 'aria-labelledby')
    })

    it('CM6 editors have aria-describedby', () => {
        cy.get('.cm-editor').first().should('have.attr', 'aria-describedby')
    })

    it('CM6 editors have role=textbox', () => {
        cy.get('.cm-editor').first().should('have.attr', 'role', 'textbox')
    })
})
```

(Do not run yet — needs the implementation below.)

- [ ] **Step 2: Replace CodeMirrorField.jsx completely**

```jsx
import React, {useEffect, useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {EditorView, keymap, lineNumbers} from '@codemirror/view';
import {defaultKeymap, indentWithTab} from '@codemirror/commands';
import {foldGutter, foldKeymap} from '@codemirror/language';
import {html} from '@codemirror/lang-html';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/autocomplete';

const editorTheme = EditorView.theme({
    '&': {fontSize: '12px'},
    '.cm-scroller': {overflow: 'auto', height: '140px'},
    '&.cm-focused': {outline: '2px solid #4a90d9', outlineOffset: '1px'}
});

export function CodeMirrorField({value, onChange, id, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy}) {
    const containerRef = useRef(null);
    const viewRef = useRef(null);
    const valueRef = useRef(value);

    useEffect(() => {
        const view = new EditorView({
            state: EditorState.create({
                doc: value || '',
                extensions: [
                    html(),
                    lineNumbers(),
                    foldGutter(),
                    closeBrackets(),
                    EditorView.lineWrapping,
                    editorTheme,
                    keymap.of([
                        {key: 'Escape', run: v => { v.dom.blur(); return true; }},
                        indentWithTab,
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        ...foldKeymap
                    ]),
                    EditorView.updateListener.of(update => {
                        if (update.docChanged) {
                            const newValue = update.state.doc.toString();
                            valueRef.current = newValue;
                            if (onChange) {
                                onChange(newValue);
                            }
                        }
                    })
                ]
            }),
            parent: containerRef.current
        });

        // ARIA wiring — CM6 renders a contenteditable div; set role + labels on it
        view.dom.setAttribute('role', 'textbox');
        view.dom.setAttribute('aria-multiline', 'true');
        if (ariaLabelledBy) {
            view.dom.setAttribute('aria-labelledby', ariaLabelledBy);
        }

        if (ariaDescribedBy) {
            view.dom.setAttribute('aria-describedby', ariaDescribedBy);
        }

        // Expose view on the container element so Cypress tests can read/set values
        containerRef.current._cmView = view;

        viewRef.current = view;
        valueRef.current = value || '';

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync external value changes (e.g. Cancel reloads saved values)
    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== undefined && value !== valueRef.current) {
            view.dispatch({
                changes: {from: 0, to: view.state.doc.length, insert: value || ''}
            });
            valueRef.current = value || '';
        }
    }, [value]);

    return (
        <div
            id={id}
            className="addstuff-cm-field"
            ref={containerRef}
            style={{border: '1px solid #ddd', borderRadius: '3px'}}
        />
    );
}

CodeMirrorField.displayName = 'CodeMirrorField';
```

- [ ] **Step 3: Verify build compiles without errors**

```bash
yarn build
```

Expected: webpack completes, no errors. Warnings about bundle size are acceptable.

- [ ] **Step 4: Commit**

```bash
git add src/javascript/AddStuff/CodeMirrorField.jsx
git commit -m "feat(a11y): rewrite CodeMirrorField with CM6 — ARIA labels, Escape-to-blur, WCAG 2.1 AA"
```

---

## Task 4: Update AddStuffSettings.jsx for ARIA, contrast, focus

**Files:**
- Modify: `src/javascript/AddStuff/AddStuffSettings.jsx`

- [ ] **Step 1: Replace AddStuffSettings.jsx completely**

```jsx
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Loader, Typography} from '@jahia/moonstone';
import {CodeMirrorField} from './CodeMirrorField';

const GQL_QUERY = `
    query getAddStuffProperties($sitePath: String!) {
        jcr {
            siteNode: nodeByPath(path: $sitePath) {
                installedModules: property(name: "j:installedModules") { values }
                addStuffHeadTop: property(name: "addStuffHeadTop") { value }
                addStuffHead:    property(name: "addStuffHead")    { value }
                addStuffBodyTop: property(name: "addStuffBodyTop") { value }
                addStuffBody:    property(name: "addStuffBody")    { value }
            }
        }
    }
`;

// Two separate mutations: Jahia may resolve addMixins and mutateProperty concurrently
// within a single mutateNode block, causing properties to be set before the mixin exists.
const GQL_ADD_MIXIN = `
    mutation addAddStuffMixin($path: String!) {
        jcr {
            mutateNode(pathOrId: $path) {
                addMixins(mixins: ["jmix:addStuff"])
            }
        }
    }
`;

const GQL_SET_PROPERTIES = `
    mutation setAddStuffProperties(
        $path: String!,
        $addStuffHeadTop: String!, $addStuffHead: String!,
        $addStuffBodyTop: String!, $addStuffBody: String!
    ) {
        jcr {
            mutateNode(pathOrId: $path) {
                p1: mutateProperty(name: "addStuffHeadTop") { setValue(type: STRING, value: $addStuffHeadTop) }
                p2: mutateProperty(name: "addStuffHead")    { setValue(type: STRING, value: $addStuffHead) }
                p3: mutateProperty(name: "addStuffBodyTop") { setValue(type: STRING, value: $addStuffBodyTop) }
                p4: mutateProperty(name: "addStuffBody")    { setValue(type: STRING, value: $addStuffBody) }
            }
        }
    }
`;

function graphql(query, variables) {
    const contextPath = window.contextJsParameters.contextPath;
    return fetch(contextPath + '/modules/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({query, variables})
    }).then(r => {
        if (!r.ok) {
            throw new Error('HTTP ' + r.status);
        }

        return r.json();
    });
}

function parseQueryResult(data) {
    const node = data?.data?.jcr?.siteNode;
    if (!node) {
        return null;
    }

    return {
        installed: Array.isArray(node.installedModules?.values) &&
            node.installedModules.values.some(m => m === 'addstuff' || m.startsWith('addstuff/')),
        addStuffHeadTop: node.addStuffHeadTop?.value || '',
        addStuffHead:    node.addStuffHead?.value    || '',
        addStuffBodyTop: node.addStuffBodyTop?.value || '',
        addStuffBody:    node.addStuffBody?.value    || ''
    };
}

const SECTION_STYLE = {
    border: '1px solid var(--color-gray_light05, #e0e0e0)',
    borderRadius: '4px',
    marginBottom: '24px',
    overflow: 'hidden'
};

const SECTION_HEADER_STYLE = {
    head: {
        padding: '8px 14px',
        background: '#e8f0fe',
        borderBottom: '1px solid #c5d4f5'
    },
    body: {
        padding: '8px 14px',
        background: '#e6f4ea',
        borderBottom: '1px solid #b7dfc0'
    }
};

const FIELDS_GRID_STYLE = {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
};

const FIELD_LABEL_STYLE = {
    fontFamily: 'var(--font-monospace, monospace)',
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '2px'
};

// #767676 on white = 4.54:1 — meets WCAG 1.4.3 AA minimum (was #aaa = 2.3:1, failed)
const HELP_TEXT_STYLE = {
    color: '#767676',
    display: 'block',
    marginBottom: '6px'
};

export function AddStuffSettings({siteKey}) {
    const {t} = useTranslation('addstuff');
    const sitePath = `/sites/${siteKey}`;
    const actionBarRef = useRef(null);

    const [installed, setInstalled] = useState(null);
    const [values, setValues] = useState({
        addStuffHeadTop: '',
        addStuffHead:    '',
        addStuffBodyTop: '',
        addStuffBody:    ''
    });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

    useEffect(() => {
        graphql(GQL_QUERY, {sitePath})
            .then(data => {
                const result = parseQueryResult(data);
                if (!result) {
                    setInstalled(false);
                    return;
                }

                setInstalled(result.installed);
                if (result.installed) {
                    setValues({
                        addStuffHeadTop: result.addStuffHeadTop,
                        addStuffHead:    result.addStuffHead,
                        addStuffBodyTop: result.addStuffBodyTop,
                        addStuffBody:    result.addStuffBody
                    });
                }
            })
            .catch(() => setInstalled(false));
    }, [sitePath]);

    const handleSave = useCallback(() => {
        setSaving(true);
        setSaveStatus(null);
        graphql(GQL_ADD_MIXIN, {path: sitePath})
            .then(() => graphql(GQL_SET_PROPERTIES, {path: sitePath, ...values}))
            .then(data => {
                setSaveStatus(data.errors?.length > 0 ? 'error' : 'success');
            })
            .catch(() => setSaveStatus('error'))
            .finally(() => {
                setSaving(false);
                actionBarRef.current?.focus();
            });
    }, [sitePath, values]);

    const handleCancel = useCallback(() => {
        setSaveStatus(null);
        graphql(GQL_QUERY, {sitePath})
            .then(data => {
                const result = parseQueryResult(data);
                if (result) {
                    setValues({
                        addStuffHeadTop: result.addStuffHeadTop,
                        addStuffHead:    result.addStuffHead,
                        addStuffBodyTop: result.addStuffBodyTop,
                        addStuffBody:    result.addStuffBody
                    });
                }
            });
        actionBarRef.current?.focus();
    }, [sitePath]);

    useEffect(() => {
        if (saveStatus) {
            const timer = setTimeout(() => setSaveStatus(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    if (installed === null) {
        return (
            <div
                role="status"
                aria-label={t('addstuff.siteSettings.loading')}
                style={{display: 'flex', justifyContent: 'center', padding: '48px'}}
            >
                <Loader size="big"/>
            </div>
        );
    }

    if (!installed) {
        return (
            <div style={{padding: '24px'}}>
                <Typography variant="body">{t('addstuff.siteSettings.notInstalled')}</Typography>
            </div>
        );
    }

    return (
        <div style={{padding: '24px', maxWidth: '1400px'}}>
            <Typography variant="heading" weight="bold" component="h2" style={{marginBottom: '8px'}}>
                {t('addstuff.siteSettings.title')}
            </Typography>
            <Typography variant="body" style={{color: 'var(--color-gray_dark05, #666)', marginBottom: '24px', display: 'block'}}>
                {t('addstuff.siteSettings.description')}
            </Typography>

            {/* <head> group — role="group" + aria-labelledby satisfies WCAG 1.3.1 (ARIA17 technique) */}
            <div role="group" aria-labelledby="addstuff-head-section" style={SECTION_STYLE}>
                <div style={SECTION_HEADER_STYLE.head}>
                    <Typography id="addstuff-head-section" variant="subheading" weight="bold" style={{fontFamily: 'monospace', color: '#2c5282'}}>
                        {'<head>'}
                    </Typography>
                </div>
                <div style={FIELDS_GRID_STYLE}>
                    <div>
                        <label id="addstuff-headTop-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffHeadTop')}
                        </label>
                        <Typography id="addstuff-headTop-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.headTop.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-headTop"
                            aria-labelledby="addstuff-headTop-label"
                            aria-describedby="addstuff-headTop-help"
                            value={values.addStuffHeadTop}
                            onChange={v => setValues(prev => ({...prev, addStuffHeadTop: v}))}
                        />
                    </div>
                    <div>
                        <label id="addstuff-head-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffHead')}
                        </label>
                        <Typography id="addstuff-head-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.head.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-head"
                            aria-labelledby="addstuff-head-label"
                            aria-describedby="addstuff-head-help"
                            value={values.addStuffHead}
                            onChange={v => setValues(prev => ({...prev, addStuffHead: v}))}
                        />
                    </div>
                </div>
            </div>

            {/* <body> group */}
            <div role="group" aria-labelledby="addstuff-body-section" style={SECTION_STYLE}>
                <div style={SECTION_HEADER_STYLE.body}>
                    <Typography id="addstuff-body-section" variant="subheading" weight="bold" style={{fontFamily: 'monospace', color: '#276534'}}>
                        {'<body>'}
                    </Typography>
                </div>
                <div style={FIELDS_GRID_STYLE}>
                    <div>
                        <label id="addstuff-bodyTop-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffBodyTop')}
                        </label>
                        <Typography id="addstuff-bodyTop-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.bodyTop.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-bodyTop"
                            aria-labelledby="addstuff-bodyTop-label"
                            aria-describedby="addstuff-bodyTop-help"
                            value={values.addStuffBodyTop}
                            onChange={v => setValues(prev => ({...prev, addStuffBodyTop: v}))}
                        />
                    </div>
                    <div>
                        <label id="addstuff-body-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffBody')}
                        </label>
                        <Typography id="addstuff-body-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.body.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-body"
                            aria-labelledby="addstuff-body-label"
                            aria-describedby="addstuff-body-help"
                            value={values.addStuffBody}
                            onChange={v => setValues(prev => ({...prev, addStuffBody: v}))}
                        />
                    </div>
                </div>
            </div>

            {/* Actions — tabIndex={-1} so focus() works after save/cancel */}
            <div ref={actionBarRef} tabIndex={-1} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Button
                    variant="primary"
                    label={t('label.save')}
                    isLoading={saving}
                    onClick={handleSave}
                />
                <Button
                    label={t('label.cancel')}
                    isDisabled={saving}
                    onClick={handleCancel}
                />
                {/* Always rendered so screen readers register the live region on page load */}
                <div role="status" aria-live="polite" aria-atomic="true" style={{minHeight: '1.5em'}}>
                    {saveStatus === 'success' && (
                        <Typography variant="body" style={{color: 'var(--color-utility_positive, #27ae60)'}}>
                            {t('addstuff.siteSettings.saved')}
                        </Typography>
                    )}
                    {saveStatus === 'error' && (
                        <Typography variant="body" style={{color: 'var(--color-utility_danger, #c0392b)'}}>
                            {t('addstuff.siteSettings.saveError', 'Save failed — please try again.')}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify build**

```bash
yarn build
```

Expected: webpack completes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/javascript/AddStuff/AddStuffSettings.jsx
git commit -m "feat(a11y): WCAG 2.1 AA — role=group, labels, aria-live, contrast fix, focus restore"
```

---

## Task 5: Update Cypress helpers and tests for CM6

**Files:**
- Modify: `tests/cypress/support/addstuff.ts:51-57`
- Modify: `tests/cypress/e2e/06-ui-settings.cy.ts`

CM5 stored the editor instance on `.CodeMirror` DOM property and exposed `.setValue()`. CM6 uses transactions. The `containerRef.current._cmView` bridge added in Task 3 makes this straightforward.

- [ ] **Step 1: Update `setCodeMirrorValue` helper in addstuff.ts**

Replace lines 51–57 (`setCodeMirrorValue`):

```typescript
export const setCodeMirrorValue = (index: number, value: string) => {
    cy.window().then(win => {
        const containers = win.document.querySelectorAll('.addstuff-cm-field')
        const view = (containers[index] as any)._cmView
        view.dispatch({
            changes: {from: 0, to: view.state.doc.length, insert: value}
        })
    })
}
```

- [ ] **Step 2: Update Cancel-flow value-read in 06-ui-settings.cy.ts**

Replace the `cy.window().then(...)` block in the "reverts editor to the last saved value after Cancel" test (lines 67–71):

```typescript
cy.window().then(win => {
    const containers = win.document.querySelectorAll('.addstuff-cm-field')
    const view = (containers[0] as any)._cmView
    const value = view.state.doc.toString()
    expect(value).to.contain('addstuff-cancel-original')
})
```

- [ ] **Step 3: Update `.CodeMirror` class selector in existing tests**

In `06-ui-settings.cy.ts`, the "loads the settings panel" test uses `.addstuff-cm-field` (no change needed — that class is preserved). Verify no remaining `.CodeMirror` references remain:

```bash
grep -n "\.CodeMirror" tests/cypress/e2e/06-ui-settings.cy.ts
```

Expected: no output. If any remain, replace `.CodeMirror` with `.cm-editor`.

Also check addstuff.ts:

```bash
grep -n "\.CodeMirror" tests/cypress/support/addstuff.ts
```

Expected: no output.

- [ ] **Step 4: Verify the ARIA test block added in Task 3/Step 1 is present**

```bash
grep -n "aria-labelledby" tests/cypress/e2e/06-ui-settings.cy.ts
```

Expected: one matching line.

- [ ] **Step 5: Add group and label assertions to the ARIA context block**

The `context('Accessibility — WCAG 2.1 AA', ...)` block added in Task 3/Step 1 should also contain these tests. Add them inside that same context:

```typescript
it('has 2 role=group sections', () => {
    cy.get('[role="group"]').should('have.length', 2)
})

it('has label elements for all 4 editors', () => {
    cy.get('label#addstuff-headTop-label').should('exist')
    cy.get('label#addstuff-head-label').should('exist')
    cy.get('label#addstuff-bodyTop-label').should('exist')
    cy.get('label#addstuff-body-label').should('exist')
})

it('has aria-live status region present on load', () => {
    cy.get('[role="status"]').should('exist')
})

it('announces save result in live region', () => {
    cy.contains('button', 'Save').click()
    cy.get('[role="status"]').should('not.be.empty')
})
```

- [ ] **Step 6: Verify build still passes**

```bash
yarn build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add tests/cypress/support/addstuff.ts tests/cypress/e2e/06-ui-settings.cy.ts
git commit -m "test(a11y): update Cypress for CM6 API and add WCAG 2.1 AA assertions"
```

---

## Task 6: Full build + E2E verification

**Files:** none changed — verification only

- [ ] **Step 1: Run full webpack build in production mode**

```bash
yarn build:production
```

Expected: no errors, `src/main/resources/javascript/apps/` contains updated bundle.

- [ ] **Step 2: Build the JAR**

```bash
mvn package -DskipTests
```

Expected: `BUILD SUCCESS`, JAR created in `target/`.

- [ ] **Step 3: Run E2E tests (requires Docker / Jahia running)**

If you have the Docker environment available (see `tests/` README):

```bash
cd tests && npx cypress run --spec "cypress/e2e/06-ui-settings.cy.ts"
```

Expected: all tests pass, including the new `Accessibility — WCAG 2.1 AA` context.

To run the full suite:

```bash
cd tests && npx cypress run
```

Expected: all tests pass.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address issues found during E2E verification"
```

---

## Self-Review

**Spec coverage:**
- 1.3.1 Info and Relationships → Task 4 (`role="group"` + `<label>`) ✓
- 1.4.3 Contrast → Task 4 (`#767676` HELP_TEXT_STYLE) ✓
- 2.1.2 No Keyboard Trap → Task 3 (CM6 Escape keymap) ✓
- 2.4.3 Focus Order → Task 4 (`actionBarRef` + `.focus()`) ✓
- 3.3.2 Labels or Instructions → Task 4 (`<label>` elements) ✓
- 4.1.2 Name, Role, Value → Task 3 (`role="textbox"`, `aria-labelledby`, `aria-describedby` on `view.dom`) ✓
- 4.1.3 Status Messages → Task 4 (`role="status" aria-live="polite"`) ✓
- Loader 4.1.2 → Task 4 (`role="status" aria-label`) ✓
- i18n loading key → Task 2 ✓

**Spec deviation:** Spec says `<fieldset>/<legend>`; plan uses `role="group" aria-labelledby`. Justification: `<legend>` has UA-mandated positioning that requires deep CSS surgery to reproduce the current section header visuals. `role="group" aria-labelledby` satisfies SC 1.3.1 via WCAG ARIA17 technique — functionally equivalent.

**Type/name consistency:**
- `_cmView` used in both CodeMirrorField.jsx and addstuff.ts ✓
- IDs `addstuff-{field}-label` / `addstuff-{field}-help` consistent across AddStuffSettings.jsx and test assertions ✓
- `HELP_TEXT_STYLE` defined once, used four times ✓
