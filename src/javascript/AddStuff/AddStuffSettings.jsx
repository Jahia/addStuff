import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useQuery, useMutation} from '@apollo/client';
import {Button, Typography} from '@jahia/moonstone';
import {GET_ADD_STUFF_SETTINGS, SAVE_ADD_STUFF_SETTINGS} from './AddStuffSettings.gql';
import {CodeMirrorField} from './components/CodeMirrorField';
import styles from './AddStuffSettings.scss';

function SectionField({label, help, value, onChange, id}) {
    return (
        <div className={styles.field}>
            <Typography variant="caption" weight="bold">{label}</Typography>
            <Typography variant="caption" className={styles.fieldHelp}>{help}</Typography>
            <CodeMirrorField value={value} onChange={onChange} id={id}/>
        </div>
    );
}

export default function AddStuffSettings({siteKey}) {
    const {t} = useTranslation('addstuff');
    const sitePath = `/sites/${siteKey}`;

    const [headTop, setHeadTop] = useState('');
    const [head, setHead] = useState('');
    const [bodyTop, setBodyTop] = useState('');
    const [body, setBody] = useState('');
    const [saveStatus, setSaveStatus] = useState(null);

    const {data, loading} = useQuery(GET_ADD_STUFF_SETTINGS, {
        variables: {sitePath},
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        const node = data?.jcr?.nodeByPath;
        if (node) {
            setHeadTop(node.addStuffHeadTop?.value || '');
            setHead(node.addStuffHead?.value || '');
            setBodyTop(node.addStuffBodyTop?.value || '');
            setBody(node.addStuffBody?.value || '');
        }
    }, [data]);

    const [saveSettings, {loading: saving}] = useMutation(SAVE_ADD_STUFF_SETTINGS, {
        onCompleted: () => setSaveStatus('success'),
        onError: () => setSaveStatus('error')
    });

    const handleSave = () => {
        setSaveStatus(null);
        saveSettings({
            variables: {
                path: sitePath,
                addStuffHeadTop: headTop,
                addStuffHead: head,
                addStuffBodyTop: bodyTop,
                addStuffBody: body
            }
        });
    };

    const handleCancel = () => {
        const node = data?.jcr?.nodeByPath;
        if (node) {
            setHeadTop(node.addStuffHeadTop?.value || '');
            setHead(node.addStuffHead?.value || '');
            setBodyTop(node.addStuffBodyTop?.value || '');
            setBody(node.addStuffBody?.value || '');
        }

        setSaveStatus(null);
    };

    if (loading && !data) {
        return (
            <div className={styles.container}>
                <Typography variant="body">{t('addstuff.label.loading')}</Typography>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Typography variant="heading" weight="bold">
                    {t('addstuff.siteSettings.title')}
                </Typography>
                <Typography variant="body">
                    {t('addstuff.siteSettings.description')}
                </Typography>
            </div>

            <div className={styles.section}>
                <div className={`${styles.sectionHeader} ${styles.headSection}`}>
                    {'<head>'}
                </div>
                <div className={styles.sectionBody}>
                    <div className={styles.fieldRow}>
                        <SectionField
                            label={t('jmix_addStuff.addStuffHeadTop')}
                            help={t('addstuff.siteSettings.headTop.help')}
                            value={headTop}
                            onChange={setHeadTop}
                            id="headTop"
                        />
                        <SectionField
                            label={t('jmix_addStuff.addStuffHead')}
                            help={t('addstuff.siteSettings.head.help')}
                            value={head}
                            onChange={setHead}
                            id="head"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={`${styles.sectionHeader} ${styles.bodySection}`}>
                    {'<body>'}
                </div>
                <div className={styles.sectionBody}>
                    <div className={styles.fieldRow}>
                        <SectionField
                            label={t('jmix_addStuff.addStuffBodyTop')}
                            help={t('addstuff.siteSettings.bodyTop.help')}
                            value={bodyTop}
                            onChange={setBodyTop}
                            id="bodyTop"
                        />
                        <SectionField
                            label={t('jmix_addStuff.addStuffBody')}
                            help={t('addstuff.siteSettings.body.help')}
                            value={body}
                            onChange={setBody}
                            id="body"
                        />
                    </div>
                </div>
            </div>

            {saveStatus === 'success' && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                    {t('addstuff.siteSettings.save.success')}
                </div>
            )}

            {saveStatus === 'error' && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                    {t('addstuff.siteSettings.save.error')}
                </div>
            )}

            <div className={styles.actions}>
                <Button
                    label={saving ? t('addstuff.label.saving') : t('addstuff.label.save')}
                    color="accent"
                    onClick={handleSave}
                    isDisabled={saving}
                />
                <Button
                    label={t('addstuff.label.cancel')}
                    variant="outlined"
                    onClick={handleCancel}
                    isDisabled={saving}
                />
            </div>
        </div>
    );
}
