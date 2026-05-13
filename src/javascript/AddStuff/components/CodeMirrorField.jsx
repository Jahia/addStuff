import React, {useRef, useEffect} from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

const CM_OPTIONS = {
    mode: 'htmlmixed',
    lineNumbers: true,
    lineWrapping: true,
    smartIndent: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    theme: 'default',
    tabSize: 2
};

export function CodeMirrorField({value, onChange}) {
    const containerRef = useRef(null);
    const cmRef = useRef(null);
    const valueRef = useRef(value || '');

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const cm = CodeMirror(containerRef.current, {...CM_OPTIONS, value: value || ''});
        cmRef.current = cm;
        valueRef.current = value || '';

        cm.on('change', editor => {
            const newValue = editor.getValue();
            valueRef.current = newValue;
            if (onChange) {
                onChange(newValue);
            }
        });

        // Defer refresh so the container has its final layout dimensions
        setTimeout(() => cm.refresh(), 0);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            cmRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (cmRef.current && value !== valueRef.current) {
            cmRef.current.setValue(value || '');
            valueRef.current = value || '';
        }
    }, [value]);

    return (
        <div
            ref={containerRef}
            style={{border: '1px solid var(--color-gray_light40, #ddd)', borderRadius: '3px'}}
        />
    );
}
