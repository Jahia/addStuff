import {DocumentNode} from 'graphql';

describe('AddStuff Site Settings', () => {
    const siteKey = 'digitall';
    const sitePath = `/sites/${siteKey}`;
    const adminPath = `/jahia/administration/${siteKey}/addStuffSiteSettings`;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const saveAddStuffSettings: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/saveAddStuffSettings.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getAddStuffSettings: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/query/getAddStuffSettings.graphql');

    function resetSettings() {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '',
                addStuffHead: '',
                addStuffBodyTop: '',
                addStuffBody: ''
            }
        });
    }

    before(() => {
        cy.login();
        resetSettings();
    });

    beforeEach(() => {
        cy.login();
    });

    it('shows the four CodeMirror editors and action buttons', () => {
        cy.visit(adminPath);

        // All four editors must be present
        cy.get('.CodeMirror').should('have.length', 4);

        // Action buttons
        cy.contains('button', 'Save').should('be.visible');
        cy.contains('button', 'Cancel').should('be.visible');
    });

    it('saves values in all four editors and shows a success alert', () => {
        cy.visit(adminPath);

        cy.setCodeMirrorValue(0, '<!-- head top -->');
        cy.setCodeMirrorValue(1, '<!-- head end -->');
        cy.setCodeMirrorValue(2, '<!-- body top -->');
        cy.setCodeMirrorValue(3, '<!-- body end -->');

        cy.contains('button', 'Save').click();

        cy.contains('As suas alterações foram guardadas.').should('not.exist');
        cy.get('[class*="alertSuccess"]').should('be.visible');

        // Verify persistence via JCR GraphQL
        cy.apollo({query: getAddStuffSettings, variables: {sitePath}})
            .its('data.jcr.nodeByPath')
            .should((node: Record<string, {value: string}>) => {
                expect(node.addStuffHeadTop.value).to.equal('<!-- head top -->');
                expect(node.addStuffHead.value).to.equal('<!-- head end -->');
                expect(node.addStuffBodyTop.value).to.equal('<!-- body top -->');
                expect(node.addStuffBody.value).to.equal('<!-- body end -->');
            });
    });

    it('reloads persisted values when navigating back to the page', () => {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '<script>/* gtm */</script>',
                addStuffHead: '<link rel="stylesheet" href="/custom.css">',
                addStuffBodyTop: '',
                addStuffBody: '<script>/* analytics */</script>'
            }
        });

        cy.visit(adminPath);

        cy.getCodeMirrorValue(0).should('equal', '<script>/* gtm */</script>');
        cy.getCodeMirrorValue(1).should('equal', '<link rel="stylesheet" href="/custom.css">');
        cy.getCodeMirrorValue(2).should('equal', '');
        cy.getCodeMirrorValue(3).should('equal', '<script>/* analytics */</script>');

        // Navigate away and come back — values must persist
        cy.visit('/jahia/administration');
        cy.visit(adminPath);

        cy.getCodeMirrorValue(0).should('equal', '<script>/* gtm */</script>');
        cy.getCodeMirrorValue(3).should('equal', '<script>/* analytics */</script>');
    });

    it('cancels edits and reverts the form to the last saved state', () => {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '<script>/* original */</script>',
                addStuffHead: '',
                addStuffBodyTop: '',
                addStuffBody: ''
            }
        });

        cy.visit(adminPath);
        cy.getCodeMirrorValue(0).should('equal', '<script>/* original */</script>');

        // Modify without saving
        cy.setCodeMirrorValue(0, '<script>/* changed */</script>');
        cy.getCodeMirrorValue(0).should('equal', '<script>/* changed */</script>');

        cy.contains('button', 'Cancel').click();

        // Value must revert to the last saved one
        cy.getCodeMirrorValue(0).should('equal', '<script>/* original */</script>');
    });

    it('clears a field via the UI and verifies it is empty in JCR', () => {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '<meta name="test" content="value">',
                addStuffHead: '',
                addStuffBodyTop: '',
                addStuffBody: ''
            }
        });

        cy.visit(adminPath);
        cy.getCodeMirrorValue(0).should('equal', '<meta name="test" content="value">');

        cy.setCodeMirrorValue(0, '');
        cy.contains('button', 'Save').click();

        cy.get('[class*="alertSuccess"]').should('be.visible');

        cy.apollo({query: getAddStuffSettings, variables: {sitePath}})
            .its('data.jcr.nodeByPath.addStuffHeadTop.value')
            .should('equal', '');
    });

    it('sets all fields via GraphQL mutation and reads them back correctly', () => {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '<script src="https://cdn.example.com/gtm.js"></script>',
                addStuffHead: '<style>body { margin: 0; }</style>',
                addStuffBodyTop: '<div id="consent-banner"></div>',
                addStuffBody: '<script>window._analytics = true;</script>'
            }
        }).then((result: {data: {jcr: {mutateNode: unknown}}}) => {
            expect(result.data.jcr.mutateNode).to.exist;
        });

        cy.apollo({query: getAddStuffSettings, variables: {sitePath}})
            .its('data.jcr.nodeByPath')
            .should((node: Record<string, {value: string}>) => {
                expect(node.addStuffHeadTop.value).to.include('gtm.js');
                expect(node.addStuffHead.value).to.include('margin: 0');
                expect(node.addStuffBodyTop.value).to.include('consent-banner');
                expect(node.addStuffBody.value).to.include('_analytics');
            });
    });

    it('injected scripts appear in the rendered page HTML', () => {
        cy.apollo({
            mutation: saveAddStuffSettings,
            variables: {
                path: sitePath,
                addStuffHeadTop: '<!-- addstuff-headtop-marker -->',
                addStuffHead: '<!-- addstuff-head-marker -->',
                addStuffBodyTop: '<!-- addstuff-bodytop-marker -->',
                addStuffBody: '<!-- addstuff-body-marker -->'
            }
        });

        // Visit the digitall site home page in preview mode
        cy.request('/sites/digitall/home.html').then(response => {
            expect(response.body).to.include('addstuff-headtop-marker');
            expect(response.body).to.include('addstuff-head-marker');
            expect(response.body).to.include('addstuff-bodytop-marker');
            expect(response.body).to.include('addstuff-body-marker');
        });
    });
});
