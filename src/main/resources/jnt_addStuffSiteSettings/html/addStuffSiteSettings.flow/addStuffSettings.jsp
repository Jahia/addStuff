<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%--@elvariable id="currentNode" type="org.jahia.services.content.JCRNodeWrapper"--%>
<%--@elvariable id="renderContext" type="org.jahia.services.render.RenderContext"--%>
<%--@elvariable id="currentResource" type="org.jahia.services.render.Resource"--%>
<%--@elvariable id="url" type="org.jahia.services.render.URLGenerator"--%>
<%--@elvariable id="siteNode" type="org.jahia.services.content.decorator.JCRSiteNode"--%>

<c:set var="cmBase" value="${pageContext.request.contextPath}/modules/addstuff/javascript/codemirror"/>

<template:addResources type="javascript" resources="jquery.min.js,admin-bootstrap.js"/>
<template:addResources type="css" resources="admin-bootstrap.css"/>

<link rel="stylesheet" href="${cmBase}/codemirror.min.css"/>
<script src="${cmBase}/codemirror.min.js"></script>
<script src="${cmBase}/mode/xml/xml.min.js"></script>
<script src="${cmBase}/mode/javascript/javascript.min.js"></script>
<script src="${cmBase}/mode/css/css.min.js"></script>
<script src="${cmBase}/mode/htmlmixed/htmlmixed.min.js"></script>

<style>
    .addstuff-section {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 24px;
        overflow: hidden;
    }
    .addstuff-section-header {
        font-family: monospace;
        font-size: 13px;
        font-weight: bold;
        padding: 8px 14px;
        background-color: #e8f0fe;
        border-bottom: 1px solid #c5d4f5;
        color: #2c5282;
    }
    .addstuff-section-header.body {
        background-color: #e6f4ea;
        border-bottom-color: #b7dfc0;
        color: #276534;
    }
    .addstuff-section-body {
        padding: 16px;
        background-color: #f5f5f5;
    }
    .addstuff-field label {
        font-family: monospace;
        font-size: 13px;
        font-weight: bold;
        color: #333;
        margin-bottom: 2px;
        display: block;
    }
    .addstuff-field .help-block {
        font-size: 11px;
        color: #aaa;
        margin: 2px 0 8px 0;
    }
    .CodeMirror {
        height: 140px;
        border-radius: 3px;
        font-size: 12px;
    }
</style>

<div class="page-header">
    <h2><fmt:message key="addstuff.siteSettings.title"/></h2>
</div>
<p class="text-muted"><fmt:message key="addstuff.siteSettings.description"/></p>

<%-- Hidden textareas carry current JCR values into CodeMirror (fn:escapeXml → browser decodes → raw value). --%>
<textarea id="addStuffHeadTop" style="display:none">${fn:escapeXml(siteNode.properties['addStuffHeadTop'])}</textarea>
<textarea id="addStuffHead"    style="display:none">${fn:escapeXml(siteNode.properties['addStuffHead'])}</textarea>
<textarea id="addStuffBodyTop" style="display:none">${fn:escapeXml(siteNode.properties['addStuffBodyTop'])}</textarea>
<textarea id="addStuffBody"    style="display:none">${fn:escapeXml(siteNode.properties['addStuffBody'])}</textarea>

<div class="container-fluid">

        <%-- HEAD section --%>
        <div class="addstuff-section">
            <div class="addstuff-section-header">&lt;head&gt;</div>
            <div class="addstuff-section-body">
                <div class="row-fluid">
                    <div class="span6 addstuff-field">
                        <fmt:message key="jmix_addStuff.addStuffHeadTop" var="labelHeadTop"/>
                        <label><c:out value="${labelHeadTop}"/></label>
                        <p class="help-block"><fmt:message key="addstuff.siteSettings.headTop.help"/></p>
                        <div id="cm-addStuffHeadTop"></div>
                    </div>
                    <div class="span6 addstuff-field">
                        <fmt:message key="jmix_addStuff.addStuffHead" var="labelHead"/>
                        <label><c:out value="${labelHead}"/></label>
                        <p class="help-block"><fmt:message key="addstuff.siteSettings.head.help"/></p>
                        <div id="cm-addStuffHead"></div>
                    </div>
                </div>
            </div>
        </div>

        <%-- BODY section --%>
        <div class="addstuff-section">
            <div class="addstuff-section-header body">&lt;body&gt;</div>
            <div class="addstuff-section-body">
                <div class="row-fluid">
                    <div class="span6 addstuff-field">
                        <fmt:message key="jmix_addStuff.addStuffBodyTop" var="labelBodyTop"/>
                        <label><c:out value="${labelBodyTop}"/></label>
                        <p class="help-block"><fmt:message key="addstuff.siteSettings.bodyTop.help"/></p>
                        <div id="cm-addStuffBodyTop"></div>
                    </div>
                    <div class="span6 addstuff-field">
                        <fmt:message key="jmix_addStuff.addStuffBody" var="labelBody"/>
                        <label><c:out value="${labelBody}"/></label>
                        <p class="help-block"><fmt:message key="addstuff.siteSettings.body.help"/></p>
                        <div id="cm-addStuffBody"></div>
                    </div>
                </div>
            </div>
        </div>

        <%-- Actions --%>
        <div class="row-fluid" style="margin-top: 8px;">
            <div class="span12">
                <button class="btn btn-primary" id="btnSave">
                    <fmt:message key="label.save"/>
                </button>
                <button class="btn" id="btnCancel">
                    <fmt:message key="label.cancel"/>
                </button>
            </div>
        </div>

    </div>

<script>
(function () {
    var contextPath = '${pageContext.request.contextPath}';
    var sitePath    = '${fn:escapeXml(siteNode.path)}';

    var cmOptions = {
        mode: 'htmlmixed',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        indentWithTabs: false,
        tabSize: 2
    };

    var fields = ['addStuffHeadTop', 'addStuffHead', 'addStuffBodyTop', 'addStuffBody'];
    var editors = {};

    fields.forEach(function (id) {
        var textarea = document.getElementById(id);
        var container = document.getElementById('cm-' + id);
        var editor = CodeMirror(container, $.extend({}, cmOptions, {
            value: textarea.value
        }));
        editors[id] = editor;
    });

    // Save via GraphQL (Content-Type: application/json bypasses the XSS servlet filter).
    var GQL_MUTATION = [
        'mutation setAddStuffProperties(',
        '  $path: String!,',
        '  $addStuffHeadTop: String!, $addStuffHead: String!,',
        '  $addStuffBodyTop: String!, $addStuffBody: String!',
        ') {',
        '  jcr {',
        '    mutateNode(pathOrId: $path) {',
        '      addMixins(mixins: ["jmix:addStuff"])',
        '      p1: mutateProperty(name: "addStuffHeadTop") { setValue(type: STRING, value: $addStuffHeadTop) }',
        '      p2: mutateProperty(name: "addStuffHead")    { setValue(type: STRING, value: $addStuffHead) }',
        '      p3: mutateProperty(name: "addStuffBodyTop") { setValue(type: STRING, value: $addStuffBodyTop) }',
        '      p4: mutateProperty(name: "addStuffBody")    { setValue(type: STRING, value: $addStuffBody) }',
        '    }',
        '  }',
        '}'
    ].join('\n');

    function showToast(message, isError) {
        var toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:4px;color:#fff;font-size:13px;z-index:9999;opacity:1;transition:opacity 0.5s;background:' + (isError ? '#c0392b' : '#27ae60');
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { document.body.removeChild(toast); }, 500);
        }, 3000);
    }

    document.getElementById('btnSave').addEventListener('click', function () {
        var btn = document.getElementById('btnSave');
        btn.disabled = true;

        var variables = { path: sitePath };
        fields.forEach(function (id) { variables[id] = editors[id].getValue(); });

        fetch(contextPath + '/modules/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({ query: GQL_MUTATION, variables: variables })
        })
        .then(function (r) {
            if (!r.ok) { throw new Error('HTTP ' + r.status); }
            return r.json();
        })
        .then(function (data) {
            if (data.errors && data.errors.length > 0) {
                showToast(data.errors[0].message, true);
                return;
            }
            var node = data.data && data.data.jcr && data.data.jcr.mutateNode;
            if (!node) {
                showToast('Unexpected server response', true);
                return;
            }
            var allSaved = node.p1.setValue && node.p2.setValue && node.p3.setValue && node.p4.setValue;
            if (!allSaved) {
                showToast('Save incomplete — check server logs', true);
                return;
            }
            showToast('Your stuff has been saved', false);
        })
        .catch(function (err) {
            showToast(err.message || 'Network error', true);
        })
        .finally(function () {
            document.getElementById('btnSave').disabled = false;
        });
    });

    document.getElementById('btnCancel').addEventListener('click', function () {
        window.location.reload();
    });
}());
</script>
