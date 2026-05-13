import {pageUrl} from '../support/addstuff'

// Combined: the render filter processes BOTH the site node and the page node.
// After tests 02 and 03, test-page has site-level AND page-level injection active simultaneously.
describe('AddStuff — Combined site + page injection', () => {
    it('site-level headTop and page-level headTop both appear on test-page', () => {
        cy.request(pageUrl('test-page')).its('body')
            .should('contain', 'addstuff-site-headtop')
            .and('contain', 'addstuff-page-headtop')
    })

    it('site-level head and page-level head both appear on test-page', () => {
        cy.request(pageUrl('test-page')).its('body')
            .should('contain', 'addstuff-site-head')
            .and('contain', 'addstuff-page-head')
    })

    it('site-level bodyTop and page-level bodyTop both appear on test-page', () => {
        cy.visit(pageUrl('test-page'))
        cy.get('body #addstuff-site-bodytop').should('exist')
        cy.get('body #addstuff-page-bodytop').should('exist')
    })

    it('site-level body and page-level body both appear on test-page', () => {
        cy.visit(pageUrl('test-page'))
        cy.get('body #addstuff-site-body').should('exist')
        cy.get('body #addstuff-page-body').should('exist')
    })

    it('site-level markers appear on other-page but page-level markers do not', () => {
        cy.request(pageUrl('other-page')).its('body')
            .should('contain', 'addstuff-site-headtop')
            .and('not.contain', 'addstuff-page-headtop')

        cy.visit(pageUrl('other-page'))
        cy.get('body #addstuff-site-body').should('exist')
        cy.get('body #addstuff-page-body').should('not.exist')
    })
})
