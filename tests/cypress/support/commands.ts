Cypress.Commands.add('setCodeMirrorValue', (id: string, value: string) => {
    cy.get(`#${id} .CodeMirror`).then(([container]) => {
        const cm = (container as HTMLElement & {CodeMirror: any}).CodeMirror;
        if (!cm) {
            throw new Error(`No CodeMirror editor found with id "${id}"`);
        }

        cm.setValue(value);
        cm.focus();
    });
});

Cypress.Commands.add('getCodeMirrorValue', (id: string) => {
    return cy.get(`#${id} .CodeMirror`).then(([container]) => {
        const cm = (container as HTMLElement & {CodeMirror: any}).CodeMirror;
        if (!cm) {
            throw new Error(`No CodeMirror editor found with id "${id}"`);
        }

        return cm.getValue();
    });
});

declare global {
    namespace Cypress {
        interface Chainable {
            setCodeMirrorValue(id: string, value: string): Chainable<void>;
            getCodeMirrorValue(id: string): Chainable<string>;
        }
    }
}
