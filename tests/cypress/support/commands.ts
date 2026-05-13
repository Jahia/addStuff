/**
 * Sets a value on a CodeMirror 5 editor by index (zero-based) within the page.
 * Uses the CodeMirror API directly to reliably set content and trigger onChange.
 */
Cypress.Commands.add('setCodeMirrorValue', (index: number, value: string) => {
    cy.window().then(win => {
        const editors = win.document.querySelectorAll('.CodeMirror');
        const container = editors[index] as HTMLElement & {CodeMirror: any};
        if (!container || !container.CodeMirror) {
            throw new Error(`No CodeMirror editor found at index ${index}`);
        }
        container.CodeMirror.setValue(value);
        container.CodeMirror.focus();
    });
});

/**
 * Reads the current value of a CodeMirror 5 editor by index.
 */
Cypress.Commands.add('getCodeMirrorValue', (index: number) => {
    return cy.window().then(win => {
        const editors = win.document.querySelectorAll('.CodeMirror');
        const container = editors[index] as HTMLElement & {CodeMirror: any};
        if (!container || !container.CodeMirror) {
            throw new Error(`No CodeMirror editor found at index ${index}`);
        }
        return container.CodeMirror.getValue();
    });
});

declare global {
    namespace Cypress {
        interface Chainable {
            setCodeMirrorValue(index: number, value: string): Chainable<void>;
            getCodeMirrorValue(index: number): Chainable<string>;
        }
    }
}
