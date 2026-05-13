import {deployEmptyTemplates, deployAddStuffModule, createTestSite, deleteTestSite, createTestPage, publishNode, pageUrl} from '../support/addstuff'

describe('AddStuff — Infrastructure', () => {
    before(() => {
        cy.login()
        deployEmptyTemplates()
        deployAddStuffModule()
        deleteTestSite()
        createTestSite()
        createTestPage('test-page')
        createTestPage('other-page')
        publishNode('/sites/addstufftest/home')
    })

    // Verify the addstuff OSGi bundle is deployed and started before running any other test.
    // If this fails, build and deploy the module first:
    //   cd .. && mvn clean install
    // then copy the JAR to your Jahia instance (or use the Jahia admin module deployment UI).
    it('addstuff module is deployed and started', () => {
        cy.apollo({
            queryFile: 'graphql/jcr/query/getStartedModulesVersion.graphql'
        }).then((resp: any) => {
            const modules: any[] = resp?.data?.dashboard?.modules ?? []
            const addstuff = modules.find((m: any) => m.id === 'addstuff')
            expect(addstuff, 'addstuff module not found — deploy the OSGi bundle first').to.exist
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
