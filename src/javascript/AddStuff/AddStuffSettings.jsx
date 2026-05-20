import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {Button, Loader, Typography} from '@jahia/moonstone';
import {CodeMirrorField} from './CodeMirrorField';

const GQL_QUERY = `
    query getAddStuffProperties($sitePath: String!) {
        jcr {
            siteNode: nodeByPath(path: $sitePath) {
                installedModules: property(name: "j:installedModules") { values }
                addStuffHeadTop: property(name: "addStuffHeadTop") { value }
                addStuffHead:    property(name: "addStuffHead")    { value }
                addStuffBodyTop: property(name: "addStuffBodyTop") { value }
                addStuffBody:    property(name: "addStuffBody")    { value }
            }
        }
    }
`;

// Two separate mutations: Jahia may resolve addMixins and mutateProperty concurrently
// within a single mutateNode block, causing properties to be set before the mixin exists.
const GQL_ADD_MIXIN = `
    mutation addAddStuffMixin($path: String!) {
        jcr {
            mutateNode(pathOrId: $path) {
                addMixins(mixins: ["jmix:addStuff"])
            }
        }
    }
`;

const GQL_SET_PROPERTIES = `
    mutation setAddStuffProperties(
        $path: String!,
        $addStuffHeadTop: String!, $addStuffHead: String!,
        $addStuffBodyTop: String!, $addStuffBody: String!
    ) {
        jcr {
            mutateNode(pathOrId: $path) {
                p1: mutateProperty(name: "addStuffHeadTop") { setValue(type: STRING, value: $addStuffHeadTop) }
                p2: mutateProperty(name: "addStuffHead")    { setValue(type: STRING, value: $addStuffHead) }
                p3: mutateProperty(name: "addStuffBodyTop") { setValue(type: STRING, value: $addStuffBodyTop) }
                p4: mutateProperty(name: "addStuffBody")    { setValue(type: STRING, value: $addStuffBody) }
            }
        }
    }
`;

function graphql(query, variables) {
    const contextPath = window.contextJsParameters.contextPath;
    return fetch(contextPath + '/modules/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({query, variables})
    }).then(r => {
        if (!r.ok) {
            throw new Error('HTTP ' + r.status);
        }

        return r.json();
    });
}

function parseQueryResult(data) {
    const node = data?.data?.jcr?.siteNode;
    if (!node) {
        return null;
    }

    return {
        installed: Array.isArray(node.installedModules?.values) &&
            node.installedModules.values.some(m => m === 'addstuff' || m.startsWith('addstuff/')),
        addStuffHeadTop: node.addStuffHeadTop?.value || '',
        addStuffHead:    node.addStuffHead?.value    || '',
        addStuffBodyTop: node.addStuffBodyTop?.value || '',
        addStuffBody:    node.addStuffBody?.value    || ''
    };
}

const SECTION_STYLE = {
    border: '1px solid var(--color-gray_light05, #e0e0e0)',
    borderRadius: '4px',
    marginBottom: '24px',
    overflow: 'hidden'
};

const SECTION_HEADER_STYLE = {
    head: {
        padding: '8px 14px',
        background: '#e8f0fe',
        borderBottom: '1px solid #c5d4f5'
    },
    body: {
        padding: '8px 14px',
        background: '#e6f4ea',
        borderBottom: '1px solid #b7dfc0'
    }
};

const FIELDS_GRID_STYLE = {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
};

const FIELD_LABEL_STYLE = {
    fontFamily: 'var(--font-monospace, monospace)',
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'block',
    marginBottom: '2px'
};

// #767676 on white = 4.54:1 — meets WCAG 1.4.3 AA minimum (was #aaa = 2.3:1, failed)
const HELP_TEXT_STYLE = {
    color: '#767676',
    display: 'block',
    marginBottom: '6px'
};

export function AddStuffSettings({siteKey}) {
    const {t} = useTranslation('addstuff');
    const sitePath = `/sites/${siteKey}`;
    const actionBarRef = useRef(null);

    const [installed, setInstalled] = useState(null);
    const [values, setValues] = useState({
        addStuffHeadTop: '',
        addStuffHead:    '',
        addStuffBodyTop: '',
        addStuffBody:    ''
    });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

    useEffect(() => {
        graphql(GQL_QUERY, {sitePath})
            .then(data => {
                const result = parseQueryResult(data);
                if (!result) {
                    setInstalled(false);
                    return;
                }

                setInstalled(result.installed);
                if (result.installed) {
                    setValues({
                        addStuffHeadTop: result.addStuffHeadTop,
                        addStuffHead:    result.addStuffHead,
                        addStuffBodyTop: result.addStuffBodyTop,
                        addStuffBody:    result.addStuffBody
                    });
                }
            })
            .catch(() => setInstalled(false));
    }, [sitePath]);

    const handleSave = useCallback(() => {
        setSaving(true);
        setSaveStatus(null);
        graphql(GQL_ADD_MIXIN, {path: sitePath})
            .then(() => graphql(GQL_SET_PROPERTIES, {path: sitePath, ...values}))
            .then(data => {
                setSaveStatus(data.errors?.length > 0 ? 'error' : 'success');
            })
            .catch(() => setSaveStatus('error'))
            .finally(() => {
                setSaving(false);
                actionBarRef.current?.focus();
            });
    }, [sitePath, values]);

    const handleCancel = useCallback(() => {
        setSaveStatus(null);
        graphql(GQL_QUERY, {sitePath})
            .then(data => {
                const result = parseQueryResult(data);
                if (result) {
                    setValues({
                        addStuffHeadTop: result.addStuffHeadTop,
                        addStuffHead:    result.addStuffHead,
                        addStuffBodyTop: result.addStuffBodyTop,
                        addStuffBody:    result.addStuffBody
                    });
                }
            });
        actionBarRef.current?.focus();
    }, [sitePath]);

    useEffect(() => {
        if (saveStatus) {
            const timer = setTimeout(() => setSaveStatus(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    if (installed === null) {
        return (
            <div
                role="status"
                aria-label={t('addstuff.siteSettings.loading')}
                style={{display: 'flex', justifyContent: 'center', padding: '48px'}}
            >
                <Loader size="big"/>
            </div>
        );
    }

    if (!installed) {
        return (
            <div style={{padding: '24px'}}>
                <Typography variant="body">{t('addstuff.siteSettings.notInstalled')}</Typography>
            </div>
        );
    }

    return (
        <div style={{padding: '24px', maxWidth: '1400px'}}>
            <Typography variant="heading" weight="bold" component="h2" style={{marginBottom: '8px'}}>
                {t('addstuff.siteSettings.title')}
            </Typography>
            <Typography variant="body" style={{color: 'var(--color-gray_dark05, #666)', marginBottom: '24px', display: 'block'}}>
                {t('addstuff.siteSettings.description')}
            </Typography>

            {/* <head> group — role="group" + aria-labelledby satisfies WCAG 1.3.1 (ARIA17 technique) */}
            <div role="group" aria-labelledby="addstuff-head-section" style={SECTION_STYLE}>
                <div style={SECTION_HEADER_STYLE.head}>
                    <Typography id="addstuff-head-section" variant="subheading" weight="bold" style={{fontFamily: 'monospace', color: '#2c5282'}}>
                        {'<head>'}
                    </Typography>
                </div>
                <div style={FIELDS_GRID_STYLE}>
                    <div>
                        <label id="addstuff-headTop-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffHeadTop')}
                        </label>
                        <Typography id="addstuff-headTop-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.headTop.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-headTop"
                            aria-labelledby="addstuff-headTop-label"
                            aria-describedby="addstuff-headTop-help"
                            value={values.addStuffHeadTop}
                            onChange={v => setValues(prev => ({...prev, addStuffHeadTop: v}))}
                        />
                    </div>
                    <div>
                        <label id="addstuff-head-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffHead')}
                        </label>
                        <Typography id="addstuff-head-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.head.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-head"
                            aria-labelledby="addstuff-head-label"
                            aria-describedby="addstuff-head-help"
                            value={values.addStuffHead}
                            onChange={v => setValues(prev => ({...prev, addStuffHead: v}))}
                        />
                    </div>
                </div>
            </div>

            {/* <body> group */}
            <div role="group" aria-labelledby="addstuff-body-section" style={SECTION_STYLE}>
                <div style={SECTION_HEADER_STYLE.body}>
                    <Typography id="addstuff-body-section" variant="subheading" weight="bold" style={{fontFamily: 'monospace', color: '#276534'}}>
                        {'<body>'}
                    </Typography>
                </div>
                <div style={FIELDS_GRID_STYLE}>
                    <div>
                        <label id="addstuff-bodyTop-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffBodyTop')}
                        </label>
                        <Typography id="addstuff-bodyTop-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.bodyTop.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-bodyTop"
                            aria-labelledby="addstuff-bodyTop-label"
                            aria-describedby="addstuff-bodyTop-help"
                            value={values.addStuffBodyTop}
                            onChange={v => setValues(prev => ({...prev, addStuffBodyTop: v}))}
                        />
                    </div>
                    <div>
                        <label id="addstuff-body-label" style={FIELD_LABEL_STYLE}>
                            {t('jmix_addStuff.addStuffBody')}
                        </label>
                        <Typography id="addstuff-body-help" variant="caption" style={HELP_TEXT_STYLE}>
                            {t('addstuff.siteSettings.body.help')}
                        </Typography>
                        <CodeMirrorField
                            id="addstuff-body"
                            aria-labelledby="addstuff-body-label"
                            aria-describedby="addstuff-body-help"
                            value={values.addStuffBody}
                            onChange={v => setValues(prev => ({...prev, addStuffBody: v}))}
                        />
                    </div>
                </div>
            </div>

            {/* Actions — tabIndex={-1} so focus() works after save/cancel */}
            <div ref={actionBarRef} tabIndex={-1} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Button
                    variant="primary"
                    label={t('label.save')}
                    isLoading={saving}
                    onClick={handleSave}
                />
                <Button
                    label={t('label.cancel')}
                    isDisabled={saving}
                    onClick={handleCancel}
                />
                {/* Always rendered so screen readers register the live region on page load */}
                <div role="status" aria-live="polite" aria-atomic="true" style={{minHeight: '1.5em'}}>
                    {saveStatus === 'success' && (
                        <Typography variant="body" style={{color: 'var(--color-utility_positive, #27ae60)'}}>
                            {t('addstuff.siteSettings.saved')}
                        </Typography>
                    )}
                    {saveStatus === 'error' && (
                        <Typography variant="body" style={{color: 'var(--color-utility_danger, #c0392b)'}}>
                            {t('addstuff.siteSettings.saveError', 'Save failed — please try again.')}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
}
