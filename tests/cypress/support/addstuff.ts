import {createSite as jahiaCreateSite, deleteSite as jahiaDeleteSite, enableModule, addNode} from '@jahia/cypress'

const siteKey = 'addstufftest'

// Deploys the empty-templates JAR bundled in fixtures/modules/.
// Uses forceUpdate:false so the install is a no-op if the module is already present.
export const deployEmptyTemplates = () => {
    const jahiaUrl = Cypress.env('JAHIA_URL') || 'http://localhost:8080'
    const password = Cypress.env('SUPER_USER_PASSWORD') || 'root1234'
    const jar = `${Cypress.config('projectRoot')}/cypress/fixtures/modules/empty-templates-1.0.0.jar`

    cy.exec(
        `curl -sf -u "root:${password}" ` +
        `-X POST "${jahiaUrl}/modules/api/provisioning" ` +
        `--form "script=[{\\"installAndStartBundle\\":\\"empty-templates-1.0.0.jar\\",\\"forceUpdate\\":false}]" ` +
        `--form "file=@${jar}"`,
        {timeout: 60000}
    ).its('code').should('eq', 0)
    cy.wait(3000)
}

// Deploys the addstuff JAR via the Jahia provisioning REST API.
// Cypress.config('projectRoot') points to tests/, so ../target is addStuff/target/.
export const deployAddStuffModule = () => {
    const jahiaUrl = Cypress.env('JAHIA_URL') || 'http://localhost:8080'
    const password = Cypress.env('SUPER_USER_PASSWORD') || 'root1234'
    const targetDir = `${Cypress.config('projectRoot')}/../target`

    cy.exec(
        `JAR=$(ls "${targetDir}"/addstuff-*.jar 2>/dev/null | grep -v sources | head -1) && ` +
        `[ -f "$JAR" ] || { echo "ERROR: JAR not found in ${targetDir}"; exit 1; } && ` +
        `JARNAME=$(basename "$JAR") && ` +
        `curl -sf -u "root:${password}" ` +
        `-X POST "${jahiaUrl}/modules/api/provisioning" ` +
        `--form "script=[{\\"installAndStartBundle\\":\\"$JARNAME\\",\\"forceUpdate\\":true,\\"uninstallPreviousVersion\\":true}]" ` +
        `--form "file=@$JAR"`,
        {timeout: 60000}
    ).its('code').should('eq', 0)
    cy.wait(5000)
}

export const pageUrl = (pageName: string) =>
    `/sites/${siteKey}/home/${pageName}.html`

export const pageUrlDefault = (pageName: string) =>
    `/cms/render/default/en/sites/${siteKey}/home/${pageName}.html`

export const createTestSite = () => {
    jahiaCreateSite(siteKey, {
        templateSet: 'empty-templates',
        serverName: 'localhost',
        locale: 'en'
    })
    enableModule('addstuff', siteKey)
}

export const deleteTestSite = () => {
    jahiaDeleteSite(siteKey)
}

export const createTestPage = (pageName: string) => {
    addNode({
        parentPathOrId: `/sites/${siteKey}/home`,
        name: pageName,
        primaryNodeType: 'jnt:page',
        properties: [
            {name: 'jcr:title', value: pageName, language: 'en'},
            {name: 'j:templateName', value: 'empty'}
        ],
        children: [{name: 'pagecontent', primaryNodeType: 'jnt:contentList'}]
    })
}

export const publishNode = (pathOrId: string, options: {includeSubTree?: boolean; waitMs?: number} = {}) => {
    cy.apollo({
        mutationFile: 'graphql/jcr/mutation/publishNode.graphql',
        variables: {
            pathOrId,
            languages: ['en'],
            publishSubNodes: true,
            includeSubTree: options.includeSubTree ?? true
        }
    })
    cy.wait(options.waitMs ?? 3000)
}

// Apply jmix:addStuff mixin to an existing node and set all four injection properties.
// Two steps: first add the mixin, then set properties. Within a single mutateNode block,
// Jahia may resolve addMixins and mutateProperty concurrently; splitting guarantees ordering.
export const applyAddStuff = (
    pathOrId: string,
    props: {headTop?: string; head?: string; bodyTop?: string; body?: string}
) => {
    cy.apollo({
        mutationFile: 'graphql/addstuff/addAddStuffMixin.graphql',
        variables: {pathOrId}
    })
    cy.apollo({
        mutationFile: 'graphql/addstuff/setAddStuffProperties.graphql',
        variables: {
            pathOrId,
            headTop: props.headTop ?? '',
            head: props.head ?? '',
            bodyTop: props.bodyTop ?? '',
            body: props.body ?? ''
        }
    })
}

// Flush ALL Jahia Ehcache instances so that the next page request gets a fresh render.
// Needed after site-node mutations: Jahia does not automatically invalidate page HTML
// cache entries when only the site node changes in the live workspace.
export const flushHtmlCache = () => {
    cy.executeGroovy('groovy/addstuff/flushHtmlCache.groovy')
}

// Poll the live-rendered page until the marker appears or timeout is reached.
// Use this instead of a fixed cy.wait after applyAddStuff on the site node,
// because site-level autopublish timing is non-deterministic.
export const waitForContent = (pageName: string, marker: string, timeoutMs = 30000) => {
    const intervalMs = 2000
    const endTime = Date.now() + timeoutMs
    const attempt = (): void => {
        cy.request({url: pageUrl(pageName), failOnStatusCode: false}).then(resp => {
            const html: string = resp.body
            cy.log(`waitForContent [${pageName}] status=${resp.status} hasCsrf=${html.includes('CsrfServlet')} hasMarker=${html.includes(marker)} len=${html.length}`)
            if (resp.status === 200 && html.includes(marker)) return
            if (Date.now() >= endTime) throw new Error(`waitForContent: '${marker}' not found on '${pageName}' after ${timeoutMs}ms (last status=${resp.status})`)
            cy.wait(intervalMs).then(() => attempt())
        })
    }
    attempt()
}
