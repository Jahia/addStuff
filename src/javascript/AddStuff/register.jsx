import React from 'react';
import {registry} from '@jahia/ui-extender';
import {Code} from '@jahia/moonstone';
import {CodeMirrorField} from './CodeMirrorField';
import {AddStuffSettings} from './AddStuffSettings';

function AddStuffSettingsRoute(props) {
    const siteKey =
        (props.match && props.match.params && props.match.params.siteKey) ||
        (window.contextJsParameters && window.contextJsParameters.siteKey);

    if (!siteKey) {
        return null;
    }

    return <AddStuffSettings siteKey={siteKey}/>;
}

export default function register() {
    registry.add('adminRoute', 'addStuffSiteSettings', {
        targets: ['administration-sites:100'],
        requiredPermission: 'siteAdminAddStuff',
        label: 'addstuff:addstuff.siteSettings.title',
        icon: <Code/>,
        isSelectable: true,
        render: () => React.createElement(AddStuffSettingsRoute)
    });

    registry.add('selectorType', 'CodeMirrorAddStuff', {
        cmp: CodeMirrorField,
        supportMultiple: false
    });
}
