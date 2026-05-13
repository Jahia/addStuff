import {adminSettingsUrl, applyAddStuff, flushHtmlCache, pageUrl, publishNode, setCodeMirrorValue, waitForContent} from '../support/addstuff'

// UI smoke tests: verify the React/Moonstone settings panel works end-to-end.
// These run after tests 01–05 while the addstufftest site is still alive.
// Note: the UI mutation writes to the default workspace; publishNode() is called
// explicitly when tests need to verify the result on the live-rendered page.
describe('AddStuff — Site settings UI', () => {
    context('Panel renders', () => {
        it('loads the settings panel with 4 CodeMirror editors', () => {
            cy.login()
            cy.visit(adminSettingsUrl())
            cy.get('.addstuff-cm-field').should('have.length', 4)
        })

        it('shows Save and Cancel buttons', () => {
            cy.login()
            cy.visit(adminSettingsUrl())
            cy.contains('button', 'Save').should('be.visible')
            cy.contains('button', 'Cancel').should('be.visible')
        })
    })

    context('Save flow', () => {
        it('saves values via CodeMirror API and shows success feedback', () => {
            cy.login()
            cy.visit(adminSettingsUrl())
            cy.get('.addstuff-cm-field').should('have.length', 4)

            setCodeMirrorValue(0, '<meta name="addstuff-ui-headtop" content="1">')

            cy.contains('button', 'Save').click()
            cy.contains('Your stuff has been saved').should('be.visible')
        })

        it('saved value appears on the live site page after publish', () => {
            publishNode('/sites/addstufftest', {includeSubTree: false})
            flushHtmlCache()
            waitForContent('test-page', 'addstuff-ui-headtop', 30000)
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-ui-headtop')
        })
    })

    context('Cancel flow', () => {
        before(() => {
            cy.login()
            applyAddStuff('/sites/addstufftest', {
                headTop: '<meta name="addstuff-cancel-original" content="1">',
                head: '',
                bodyTop: '',
                body: ''
            })
            publishNode('/sites/addstufftest', {includeSubTree: false})
        })

        it('reverts editor to the last saved value after Cancel', () => {
            cy.login()
            cy.visit(adminSettingsUrl())
            cy.get('.addstuff-cm-field').should('have.length', 4)

            // Modify headTop without saving
            setCodeMirrorValue(0, '<meta name="addstuff-cancel-changed" content="1">')

            cy.contains('button', 'Cancel').click()

            // Editor must show the last saved value
            cy.window().then(win => {
                const editors = win.document.querySelectorAll('.addstuff-cm-field .CodeMirror')
                const value = (editors[0] as any).CodeMirror.getValue()
                expect(value).to.contain('addstuff-cancel-original')
            })
        })
    })
})
