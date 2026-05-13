import React, {useEffect, useRef} from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

// Global styles injected once — CodeMirror class names are third-party globals
// and must not be locally scoped by CSS modules.
const ADDSTUFF_STYLES = `
.addstuff-cm-field .CodeMirror { height: 140px; font-size: 12px; }
.CodeMirror-foldgutter-open:after  { content: "\\25BE"; }
.CodeMirror-foldgutter-folded:after { content: "\\25B8"; }
`;

let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) {
        return;
    }

    const style = document.createElement('style');
    style.textContent = ADDSTUFF_STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
}

export function CodeMirrorField({value, onChange}) {
    const containerRef = useRef(null);
    const cmRef = useRef(null);
    const valueRef = useRef(value);

    // Mount: create the CodeMirror instance
    useEffect(() => {
        injectStyles();

        const cm = CodeMirror(containerRef.current, {
            value: value || '',
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
        });

        cmRef.current = cm;
        valueRef.current = value || '';

        cm.on('change', editor => {
            valueRef.current = editor.getValue();
            if (onChange) {
                onChange(editor.getValue());
            }
        });

        // Defer refresh so the container has its final layout dimensions —
        // otherwise CodeMirror measures the gutter at 1px and code overlaps line numbers.
        setTimeout(() => cm.refresh(), 0);

        return () => {
            cmRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync external value changes (e.g. language switch in content editor)
    useEffect(() => {
        if (cmRef.current && value !== undefined && value !== valueRef.current) {
            cmRef.current.setValue(value || '');
            valueRef.current = value || '';
        }
    }, [value]);

    return (
        <div
            className="addstuff-cm-field"
            ref={containerRef}
            style={{border: '1px solid #ddd', borderRadius: '3px'}}
        />
    );
}

CodeMirrorField.displayName = 'CodeMirrorField';
