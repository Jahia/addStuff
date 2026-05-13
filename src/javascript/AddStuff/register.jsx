import React from 'react';
import {registry} from '@jahia/ui-extender';
import AddStuffSettings from './AddStuffSettings';

function AddStuffSettingsRoute(props) {
    const siteKey =
        (props.match && props.match.params && props.match.params.siteKey) ||
        window.contextJsParameters.siteKey;

    if (!siteKey) {
        return <div>No site selected.</div>;
    }

    return <AddStuffSettings siteKey={siteKey}/>;
}

export default function register() {
    registry.add('adminRoute', 'addStuffSiteSettings', {
        targets: ['administration-sites:100'],
        requiredPermission: 'siteAdminAddStuff',
        label: 'addstuff:addstuff.siteSettings.title',
        icon: window.jahia.moonstone.toIconComponent('Code'),
        isSelectable: true,
        render: () => React.createElement(AddStuffSettingsRoute)
    });

    registry.add('selectorType', 'CodeMirrorAddStuff', {
        cmp: CodeMirrorSelectorType,
        supportMultiple: false
    });
}

// Thin wrapper for the Content Editor selectorType — same CodeMirrorField reused
function CodeMirrorSelectorType({value, onChange}) {
    // Lazy-import to avoid loading CodeMirror at registration time
    const {CodeMirrorField} = require('./components/CodeMirrorField');
    return <CodeMirrorField value={value || ''} onChange={onChange}/>;
}

CodeMirrorSelectorType.displayName = 'CodeMirrorSelectorType';
