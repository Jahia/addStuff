import {applyAddStuff, publishNode, pageUrl} from '../support/addstuff'

// Page-level injection: properties set on a page node appear only on that page.
describe('AddStuff — Page-level injection', () => {
    before(() => {
        cy.login()
        applyAddStuff('/sites/addstufftest/home/test-page', {
            headTop: '<meta name="addstuff-page-headtop" content="1">',
            head:    '<meta name="addstuff-page-head" content="1">',
            bodyTop: '<div id="addstuff-page-bodytop"></div>',
            body:    '<div id="addstuff-page-body"></div>'
        })
        publishNode('/sites/addstufftest/home/test-page')
    })

    context('Injection present on test-page', () => {
        it('addStuffHeadTop content is present in the HTML', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-page-headtop')
        })

        it('addStuffHead content is present in the HTML', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-page-head')
        })

        it('addStuffBodyTop content is present in the body', () => {
            cy.visit(pageUrl('test-page'))
            cy.get('body #addstuff-page-bodytop').should('exist')
        })

        it('addStuffBody content is present in the body', () => {
            cy.visit(pageUrl('test-page'))
            cy.get('body #addstuff-page-body').should('exist')
        })
    })

    context('Injection absent on other-page (scoped to test-page only)', () => {
        it('addStuffHeadTop does not appear on other-page', () => {
            cy.request(pageUrl('other-page')).its('body')
                .should('not.contain', 'addstuff-page-headtop')
        })

        it('addStuffHead does not appear on other-page', () => {
            cy.request(pageUrl('other-page')).its('body')
                .should('not.contain', 'addstuff-page-head"')
        })

        it('addStuffBodyTop does not appear on other-page', () => {
            cy.visit(pageUrl('other-page'))
            cy.get('body #addstuff-page-bodytop').should('not.exist')
        })

        it('addStuffBody does not appear on other-page', () => {
            cy.visit(pageUrl('other-page'))
            cy.get('body #addstuff-page-body').should('not.exist')
        })
    })
})
