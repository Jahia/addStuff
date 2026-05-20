# WCAG 2.1 AA Compliance — addStuff Admin Panel

**Date:** 2026-05-20  
**Scope:** Admin panel React UI only (`AddStuffSettings.jsx`, `CodeMirrorField.jsx`)  
**Target:** WCAG 2.1 Level AA

---

## Context

addStuff is a Jahia OSGi module that injects custom HTML into page `<head>` and `<body>`. Its admin panel is a React 18 component rendered inside Jahia's back-office, using Moonstone UI and CodeMirror 5 for four code editor fields.

Zero accessibility attributes exist in the current codebase. All a11y relies on Moonstone and CodeMirror defaults.

---

## WCAG 2.1 AA Gaps

| # | Criterion | Failure | Fix |
|---|-----------|---------|-----|
| 1.3.1 | Info and Relationships | `<span>` labels not programmatically linked to editors | `<label htmlFor>` + `id` on each editor |
| 1.4.3 | Contrast (Minimum) | Help text `#aaa` on white = 2.3:1 (fails 4.5:1) | Change to `#767676` (4.54:1) |
| 2.1.2 | No Keyboard Trap | CodeMirror 5 captures Tab; no way to exit via keyboard | Upgrade to CM6 + Escape-to-blur keymap |
| 2.4.3 | Focus Order | Focus lost after Save/Cancel | Restore focus to Save button after action |
| 3.3.2 | Labels or Instructions | No visible/accessible label on code editors | `<label>` elements with `htmlFor` |
| 4.1.2 | Name, Role, Value | Custom editor widget has no ARIA name/role | `aria-labelledby` + `aria-describedby` on CM6 `EditorView.dom` |
| 4.1.3 | Status Messages | Save success/error not in an `aria-live` region | `role="status" aria-live="polite"` container |

Section header colors already pass: `#2c5282` on `#e8f0fe` = 5.7:1 ✓, `#276534` on `#e6f4ea` = 5.1:1 ✓.

---

## Architecture

Four files change. Static `src/main/resources/javascript/codemirror/` is untouched (serves Jahia Content Editor fieldset selector, separate context).

| File | Change |
|------|--------|
| `package.json` | Replace `codemirror ^5.65.0` with CM6 packages |
| `src/javascript/AddStuff/CodeMirrorField.jsx` | Full rewrite: CM6 API, ARIA props, Escape keymap |
| `src/javascript/AddStuff/AddStuffSettings.jsx` | fieldset/legend, label/htmlFor, aria-live, contrast fix, focus restoration |
| `tests/cypress/e2e/06-ui-settings.cy.ts` | Add ARIA assertions |

---

## Component Design

### CodeMirrorField.jsx

**New props:** `id`, `aria-labelledby`, `aria-describedby`

**CM6 setup:**
```js
const state = EditorState.create({
    doc: value || '',
    extensions: [
        html(),
        lineNumbers(),
        foldGutter(),
        closeBrackets(),
        matchBrackets(),
        EditorView.theme({ '.cm-editor': { height: '140px', fontSize: '12px' } }),
        EditorView.lineWrapping,
        keymap.of([
            { key: 'Escape', run: view => { view.dom.blur(); return true; } },
            indentWithTab,
            ...defaultKeymap,
            ...foldKeymap,
            ...closeBracketsKeymap
        ]),
        EditorView.updateListener.of(update => {
            if (update.docChanged) onChange(update.state.doc.toString());
        })
    ]
});

const view = new EditorView({ state, parent: containerRef.current });

// Wire ARIA after mount
view.dom.setAttribute('role', 'textbox');
view.dom.setAttribute('aria-multiline', 'true');
if (ariaLabelledBy) view.dom.setAttribute('aria-labelledby', ariaLabelledBy);
if (ariaDescribedBy) view.dom.setAttribute('aria-describedby', ariaDescribedBy);
```

Value sync uses a CM6 transaction:
```js
view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value || '' } });
```

No CSS imports — CM6 ships its theme via JS extensions.

### AddStuffSettings.jsx

**Structural changes:**

1. **fieldset/legend** — each section `<div>` becomes `<fieldset>`, header becomes `<legend>`. UA default fieldset styles reset inline (border, padding, margin) to preserve current visuals.

2. **Label association** — `<span>` → `<label id="addstuff-{field}-label">`. CM6 is not a native input so `htmlFor` is not used; instead, `aria-labelledby="addstuff-{field}-label"` is set directly on `EditorView.dom`. Each help `<Typography>` gets `id="addstuff-{field}-help"`. Each `<CodeMirrorField>` receives `aria-labelledby` and `aria-describedby` props forwarded to `view.dom`.

3. **Contrast** — Help text color: `var(--color-gray_dark03, #aaa)` → `var(--color-gray_dark03, #767676)`.

4. **aria-live region** — replaces conditional success/error `<Typography>` nodes:
```jsx
<div role="status" aria-live="polite" aria-atomic="true" style={{ minHeight: '1.5em' }}>
    {saveStatus === 'success' && t('addstuff.siteSettings.saved')}
    {saveStatus === 'error'   && t('addstuff.siteSettings.saveError')}
</div>
```
Always rendered (not conditionally mounted) — screen readers must see the live region before it fires.

5. **Focus restoration** — `useRef` on Save button; `.focus()` called in `handleSave` `.finally()` and in `handleCancel`.

6. **Loader state** — wrapped:
```jsx
<div role="status" aria-label={t('addstuff.loading', 'Loading…')}>
    <Loader size="big" />
</div>
```

---

## package.json

Remove: `"codemirror": "^5.65.0"`

Add:
```json
"@codemirror/commands": "^6.0.0",
"@codemirror/lang-html": "^6.0.0",
"@codemirror/language": "^6.0.0",
"@codemirror/state": "^6.0.0",
"@codemirror/view": "^6.0.0"
```

---

## Tests (06-ui-settings.cy.ts additions)

```typescript
it('has 2 fieldset groups', () => {
    cy.get('fieldset').should('have.length', 2);
});

it('has label elements for all 4 editors', () => {
    cy.get('label#addstuff-headTop-label').should('exist');
    cy.get('label#addstuff-head-label').should('exist');
    cy.get('label#addstuff-bodyTop-label').should('exist');
    cy.get('label#addstuff-body-label').should('exist');
});

it('has aria-live status region present on load', () => {
    cy.get('[role="status"]').should('exist');
});

it('announces save result in live region', () => {
    cy.contains('button', 'Save').click();
    cy.get('[role="status"]').should('not.be.empty');
});

it('wires aria-labelledby on CM6 editors', () => {
    cy.get('.cm-editor').first().should('have.attr', 'aria-labelledby');
});
```

---

## Out of scope

- Static `codemirror/` assets (Jahia Content Editor fieldset, not admin panel)
- Injected HTML content (user-authored, bundle cannot guarantee compliance)
- Moonstone component internals (Jahia's library responsibility)
- WCAG AAA criteria
