package org.jahia.modules.addStuff.sitesettings;

import org.jahia.services.content.decorator.JCRSiteNode;
import org.jahia.services.render.RenderContext;
import org.springframework.webflow.execution.RequestContext;

import javax.jcr.RepositoryException;
import java.io.Serializable;

/**
 * Spring Webflow handler for the AddStuff site settings panel.
 * Exposes the site node to the view; saving is handled by the JSP via GraphQL.
 */
public class AddStuffSiteSettingsFlowHandler implements Serializable {

    private static final long serialVersionUID = 1L;

    public JCRSiteNode getSiteNode(RequestContext ctx) throws RepositoryException {
        return getRenderContext(ctx).getSite();
    }

    private RenderContext getRenderContext(RequestContext ctx) {
        return (RenderContext) ctx.getExternalContext().getRequestMap().get("renderContext");
    }
}
