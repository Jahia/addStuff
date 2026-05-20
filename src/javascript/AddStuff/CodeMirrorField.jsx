import React, {useEffect, useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {EditorView, keymap, lineNumbers} from '@codemirror/view';
import {defaultKeymap, indentWithTab} from '@codemirror/commands';
import {foldGutter, foldKeymap} from '@codemirror/language';
import {html} from '@codemirror/lang-html';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/autocomplete';

const editorTheme = EditorView.theme({
    '&': {fontSize: '12px'},
    '.cm-scroller': {overflow: 'auto', height: '140px'},
    '&.cm-focused': {outline: '2px solid #4a90d9', outlineOffset: '1px'}
});

export function CodeMirrorField({value, onChange, id, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy}) {
    const containerRef = useRef(null);
    const viewRef = useRef(null);
    const valueRef = useRef(value);

    useEffect(() => {
        const view = new EditorView({
            state: EditorState.create({
                doc: value || '',
                extensions: [
                    html(),
                    lineNumbers(),
                    foldGutter(),
                    closeBrackets(),
                    EditorView.lineWrapping,
                    editorTheme,
                    keymap.of([
                        {key: 'Escape', run: v => { v.dom.blur(); return true; }},
                        indentWithTab,
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        ...foldKeymap
                    ]),
                    EditorView.updateListener.of(update => {
                        if (update.docChanged) {
                            const newValue = update.state.doc.toString();
                            valueRef.current = newValue;
                            if (onChange) {
                                onChange(newValue);
                            }
                        }
                    })
                ]
            }),
            parent: containerRef.current
        });

        // ARIA wiring — CM6 renders a contenteditable div; set role + labels on it
        view.dom.setAttribute('role', 'textbox');
        view.dom.setAttribute('aria-multiline', 'true');
        if (ariaLabelledBy) {
            view.dom.setAttribute('aria-labelledby', ariaLabelledBy);
        }

        if (ariaDescribedBy) {
            view.dom.setAttribute('aria-describedby', ariaDescribedBy);
        }

        // Expose view on the container element so Cypress tests can read/set values
        containerRef.current._cmView = view;

        viewRef.current = view;
        valueRef.current = value || '';

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync external value changes (e.g. Cancel reloads saved values)
    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== undefined && value !== valueRef.current) {
            view.dispatch({
                changes: {from: 0, to: view.state.doc.length, insert: value || ''}
            });
            valueRef.current = value || '';
        }
    }, [value]);

    return (
        <div
            id={id}
            className="addstuff-cm-field"
            ref={containerRef}
            style={{border: '1px solid #ddd', borderRadius: '3px'}}
        />
    );
}

CodeMirrorField.displayName = 'CodeMirrorField';
