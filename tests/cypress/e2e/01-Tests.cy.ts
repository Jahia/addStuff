import {createTestSite, createTestPage, publishNode, pageUrl} from '../support/addstuff'

describe('AddStuff — Infrastructure', () => {
    before(() => {
        cy.login()
        createTestSite()
        createTestPage('test-page')
        createTestPage('other-page')
        publishNode('/sites/addstufftest/home')
    })

    // Verify the addstuff OSGi bundle is deployed and active before running any other test.
    // If this fails, build and deploy the module first:
    //   cd .. && mvn clean install
    // then copy the JAR to your Jahia instance (or use the Jahia admin module deployment UI).
    it('addstuff module is deployed and active', () => {
        cy.apollo({
            queryFile: 'graphql/jcr/query/getStartedModulesVersion.graphql',
            variables: {moduleId: 'addstuff'}
        }).then((resp: any) => {
            const modules = resp?.data?.admin?.jahia?.modules
            expect(modules, 'addstuff module not found — deploy the OSGi bundle first').to.have.length.greaterThan(0)
            const active = modules.find((m: any) => m.state === 'Active' || m.state === 'ACTIVE')
            expect(active, `addstuff module found but not Active (state: ${modules[0]?.state})`).to.exist
        })
    })

    it('test-page is accessible in live mode', () => {
        cy.request({url: pageUrl('test-page'), failOnStatusCode: false})
            .its('status').should('eq', 200)
    })

    it('other-page is accessible in live mode', () => {
        cy.request({url: pageUrl('other-page'), failOnStatusCode: false})
            .its('status').should('eq', 200)
    })

    it('rendered page contains a <head> element', () => {
        cy.request(pageUrl('test-page')).its('body').should('contain', '</head>')
    })

    it('rendered page contains a <body> element', () => {
        cy.request(pageUrl('test-page')).its('body').should('contain', '</body>')
    })
})
