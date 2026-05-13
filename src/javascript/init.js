import {registry} from '@jahia/ui-extender';
import i18next from 'i18next';
import register from './AddStuff/register';

export default function () {
    registry.add('callback', 'addstuff', {
        targets: ['jahiaApp-init:50'],
        callback: async () => {
            await i18next.loadNamespaces('addstuff', () => {
                console.debug('%c AddStuff: i18n namespace loaded', 'color: #3c8cba');
            });
            register();
            console.debug('%c AddStuff: activation completed', 'color: #3c8cba');
        }
    });
}
