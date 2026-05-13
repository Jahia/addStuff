import {deleteTestSite} from '../support/addstuff'

describe('AddStuff — Teardown', () => {
    it('deletes the test site', () => {
        cy.login()
        deleteTestSite()
    })
})
