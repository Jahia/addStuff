import {createSite as jahiaCreateSite, deleteSite as jahiaDeleteSite, enableModule, addNode} from '@jahia/cypress'

const siteKey = 'addstufftest'

export const pageUrl = (pageName: string, lang = 'en') =>
    `/cms/render/live/${lang}/sites/${siteKey}/home/${pageName}.html`

export const createTestSite = () => {
    jahiaCreateSite(siteKey, {
        templateSet: 'bootstrap5-templates-starter',
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
            {name: 'j:templateName', value: 'starter'}
        ],
        children: [{name: 'pagecontent', primaryNodeType: 'jnt:contentList'}]
    })
}

export const publishNode = (pathOrId: string) => {
    cy.apollo({
        mutationFile: 'graphql/jcr/mutation/publishNode.graphql',
        variables: {
            pathOrId,
            languages: ['en'],
            publishSubNodes: true,
            includeSubTree: true
        }
    })
    cy.wait(3000)
}

// Apply jmix:addStuff mixin to an existing node and set all four injection properties.
// Pass an empty string for any injection point you want to clear/leave empty.
export const applyAddStuff = (
    pathOrId: string,
    props: {headTop?: string; head?: string; bodyTop?: string; body?: string}
) => {
    cy.apollo({
        mutationFile: 'graphql/addstuff/applyAddStuff.graphql',
        variables: {
            pathOrId,
            headTop: props.headTop ?? '',
            head: props.head ?? '',
            bodyTop: props.bodyTop ?? '',
            body: props.body ?? ''
        }
    })
}
