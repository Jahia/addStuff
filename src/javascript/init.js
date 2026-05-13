import {registry} from '@jahia/ui-extender';
import register from './AddStuff/register';
import i18next from 'i18next';

export default function () {
    registry.add('callback', 'addstuff', {
        targets: ['jahiaApp-init:50'],
        callback: async () => {
            await i18next.loadNamespaces('addstuff');
            register();
        }
    });
}
