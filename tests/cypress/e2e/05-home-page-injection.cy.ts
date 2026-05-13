import {applyAddStuff, publishNode, homeUrl, pageUrl} from '../support/addstuff'

// jmix:addStuff extends jnt:page — verify that properties set directly on the home page
// (a jnt:page node, not a sub-page) produce the expected injections when visiting that page.
describe('AddStuff — Home page injection (jnt:page)', () => {
    before(() => {
        cy.login()
        applyAddStuff('/sites/addstufftest/home', {
            headTop: '<meta name="addstuff-home-headtop" content="1">',
            head:    '<meta name="addstuff-home-head" content="1">',
            bodyTop: '<div id="addstuff-home-bodytop"></div>',
            body:    '<div id="addstuff-home-body"></div>'
        })
        publishNode('/sites/addstufftest/home', {includeSubTree: false})
    })

    context('Injection present on home page', () => {
        it('addStuffHeadTop content is present in the HTML', () => {
            cy.request(homeUrl()).its('body')
                .should('contain', 'addstuff-home-headtop')
        })

        it('addStuffHead content is present in the HTML', () => {
            cy.request(homeUrl()).its('body')
                .should('contain', 'addstuff-home-head')
        })

        it('addStuffBodyTop content is present in the body', () => {
            cy.visit(homeUrl())
            cy.get('body #addstuff-home-bodytop').should('exist')
        })

        it('addStuffBody content is present in the body', () => {
            cy.visit(homeUrl())
            cy.get('body #addstuff-home-body').should('exist')
        })
    })

    context('Injection absent on sub-pages (scoped to home page only)', () => {
        it('addStuffHeadTop does not appear on test-page', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('not.contain', 'addstuff-home-headtop')
        })

        it('addStuffBodyTop does not appear on test-page', () => {
            cy.visit(pageUrl('test-page'))
            cy.get('body #addstuff-home-bodytop').should('not.exist')
        })
    })
})
