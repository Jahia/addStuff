package org.jahia.modules.addStuff;

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import net.htmlparser.jericho.*;
import org.apache.commons.lang.StringUtils;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.render.RenderContext;
import org.jahia.services.render.Resource;
import org.jahia.services.render.filter.AbstractFilter;
import org.jahia.services.render.filter.RenderChain;
import org.jahia.services.render.filter.RenderFilter;
import org.jahia.services.render.filter.cache.AggregateCacheFilter;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Render filter that injects custom HTML into the HEAD and BODY sections of a page.
 *
 * <p>Injection points are configured via the {@code jmix:addStuff} mixin, which can be applied
 * at site level (all pages) or page level (single page). Both levels can be active simultaneously:
 * site-level content is processed first, then page-level content is appended at the same location.
 *
 * <p>This filter only runs in {@code live} and {@code preview} modes — nothing is injected in edit mode.
 */
@Component(service = RenderFilter.class)
public class AddStuff extends AbstractFilter {

    private static final Logger logger = LoggerFactory.getLogger(AddStuff.class);

    @Activate
    public void activate() {
        setPriority(16.5f);
        setApplyOnConfigurations("page");
        setSkipOnConfiguration("include,wrapper");
        setApplyOnModes("live,preview");
        setDescription("Injects custom HTML code into head and body sections");
    }

    @Override
    public String execute(String previousOut, RenderContext renderContext, Resource resource, RenderChain chain) throws Exception {
        String out = previousOut;

        // Check both the site node (global injection) and the current page node (page-specific injection).
        // Using a Set avoids double-processing if site and page happen to be the same node.
        Set<JCRNodeWrapper> nodesToCheck = new HashSet<JCRNodeWrapper>();
        nodesToCheck.add(renderContext.getSite());
        nodesToCheck.add(resource.getNode());

        Iterator<JCRNodeWrapper> i = nodesToCheck.iterator();

        while (i.hasNext()) {
            JCRNodeWrapper node = i.next();
            if (node.isNodeType("jmix:addStuff")) {

                String addStuffHeadTop = node.hasProperty("addStuffHeadTop") ? node.getProperty("addStuffHeadTop").getString() : null;
                String addStuffHead = node.hasProperty("addStuffHead") ? node.getProperty("addStuffHead").getString() : null;
                String addStuffBodyTop = node.hasProperty("addStuffBodyTop") ? node.getProperty("addStuffBodyTop").getString() : null;
                String addStuffBody = node.hasProperty("addStuffBody") ? node.getProperty("addStuffBody").getString() : null;

                if (StringUtils.isNotBlank(addStuffHeadTop) || StringUtils.isNotBlank(addStuffHead) || StringUtils.isNotBlank(addStuffBodyTop) || StringUtils.isNotBlank(addStuffBody)) {
                    Source source = new Source(out);
                    OutputDocument outputDocument = new OutputDocument(source);
                    if (StringUtils.isNotBlank(addStuffHeadTop)) {
                        List<Element> headElementList = source.getAllElements(HTMLElementName.HEAD);
                        for (Element element : headElementList) {
                            final StartTag headStartTag = element.getStartTag();
                            outputDocument.replace(headStartTag.getBegin() + headStartTag.toString().indexOf(">"), headStartTag.getBegin() + headStartTag.toString().indexOf(">") + 1,
                                    ">\n" + AggregateCacheFilter.removeCacheTags(addStuffHeadTop) + "\n");
                            break; // only process the first <head> element
                        }
                    }
                    if (StringUtils.isNotBlank(addStuffHead)) {
                        List<Element> headElementList = source.getAllElements(HTMLElementName.HEAD);
                        for (Element element : headElementList) {
                            final EndTag headEndTag = element.getEndTag();
                            outputDocument.replace(headEndTag.getBegin(), headEndTag.getBegin() + 1,
                                    "\n" + AggregateCacheFilter.removeCacheTags(addStuffHead) + "\n<");
                            break; // only process the first <head> element
                        }
                    }
                    if (StringUtils.isNotBlank(addStuffBodyTop)) {
                        List<Element> bodyElementList = source.getAllElements(HTMLElementName.BODY);
                        for (Element element : bodyElementList) {
                            final StartTag bodyStartTag = element.getStartTag();
                            outputDocument.replace(bodyStartTag.getBegin() + bodyStartTag.toString().indexOf(">"), bodyStartTag.getBegin() + bodyStartTag.toString().indexOf(">") + 1,
                                    ">\n" + AggregateCacheFilter.removeCacheTags(addStuffBodyTop) + "\n");
                            break; // only process the first <body> element
                        }
                    }
                    if (StringUtils.isNotBlank(addStuffBody)) {
                        List<Element> bodyElementList = source.getAllElements(HTMLElementName.BODY);
                        for (Element element : bodyElementList) {
                            final EndTag bodyEndTag = element.getEndTag();
                            // removeCacheTags strips Jahia cache markers that may be present in the rendered output
                            outputDocument.replace(bodyEndTag.getBegin(), bodyEndTag.getBegin() + 1, "\n" + AggregateCacheFilter.removeCacheTags(addStuffBody) + "\n<");
                            break; // only process the first <body> element
                        }
                    }
                    out = outputDocument.toString().trim();
                }
            }
        }
        return out;
    }

}
