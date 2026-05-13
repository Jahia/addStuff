import {applyAddStuff, publishNode, flushHtmlCache, waitForContent, pageUrl} from '../support/addstuff'

// Site-level injection: properties set on the site node appear on EVERY page of the site.
describe('AddStuff — Site-level injection', () => {
    before(() => {
        cy.login()
        applyAddStuff('/sites/addstufftest', {
            headTop: '<meta name="addstuff-site-headtop" content="1">',
            head:    '<meta name="addstuff-site-head" content="1">',
            bodyTop: '<div id="addstuff-site-bodytop"></div>',
            body:    '<div id="addstuff-site-body"></div>'
        })
        // Publish the site node to live workspace (autopublish alone is too slow).
        // Then flush ALL Jahia HTML caches: Jahia does not automatically invalidate
        // page cache entries when only the site node changes in live workspace.
        publishNode('/sites/addstufftest', {includeSubTree: false, waitMs: 10000})
        flushHtmlCache()
        cy.wait(5000)
        waitForContent('test-page', 'addstuff-site-headtop', 60000)
    })

    context('Injection on test-page', () => {
        it('addStuffHeadTop content is present in the <head>', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-site-headtop')
        })

        it('addStuffHead content is present in the <head>', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-site-head')
        })

        it('addStuffBodyTop content is present in the <body>', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-site-bodytop')
        })

        it('addStuffBody content is present in the <body>', () => {
            cy.request(pageUrl('test-page')).its('body')
                .should('contain', 'addstuff-site-body')
        })

        it('headTop is injected before head (ordering)', () => {
            cy.request(pageUrl('test-page')).its('body').then(html => {
                expect(html.indexOf('addstuff-site-headtop')).to.be.lessThan(
                    html.indexOf('addstuff-site-head"')
                )
            })
        })

        it('bodyTop is injected before body (ordering)', () => {
            cy.request(pageUrl('test-page')).its('body').then(html => {
                expect(html.indexOf('addstuff-site-bodytop')).to.be.lessThan(
                    html.indexOf('addstuff-site-body"')
                )
            })
        })

        it('headTop marker appears before </head>', () => {
            cy.request(pageUrl('test-page')).its('body').then(html => {
                expect(html.indexOf('addstuff-site-headtop')).to.be.lessThan(
                    html.indexOf('</head>')
                )
            })
        })

        it('body marker appears before </body>', () => {
            cy.request(pageUrl('test-page')).its('body').then(html => {
                expect(html.indexOf('addstuff-site-body"')).to.be.lessThan(
                    html.indexOf('</body>')
                )
            })
        })
    })

    context('Site injection also applies to other-page', () => {
        it('addStuffHeadTop appears on other-page too', () => {
            cy.request(pageUrl('other-page')).its('body')
                .should('contain', 'addstuff-site-headtop')
        })

        it('addStuffBody appears on other-page too', () => {
            cy.request(pageUrl('other-page')).its('body')
                .should('contain', 'addstuff-site-body')
        })
    })
})
