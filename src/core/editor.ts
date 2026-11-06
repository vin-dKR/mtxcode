import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState, Prec, type Extension } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { getCM, Vim, vim } from '@replit/codemirror-vim';
import { editorNavigationDescription, inlineReference } from './inlineReference';
import { getLanguage, type EditorAdapter, type Language } from './languages';

export type EditorLanguage = Language;

export interface EditorChange {
    inserted: number;
    deleted: number;
    paste: boolean;
    lines: { line: number; deleted: number }[];
}

export interface EditorOptions {
    language: EditorLanguage;
    vim: boolean;
    saveKey?: string;
    inlineReference?: readonly string[] | null;
    onChange: (value: string, event: EditorChange) => void;
    onVimMode: (mode: string) => void;
    onLineChange: (line: number) => void;
    onSave: () => void;
}

export interface VimMapping {
    from: string;
    to: string;
    mode: 'normal' | 'insert' | 'visual';
}

const indent = '    ';
const languageExtensions: Record<EditorAdapter, () => Extension> = {
    javascript: () => javascript(),
    typescript: () => javascript({ typescript: true }),
};
const saveCallbacks = new WeakMap<object, () => void>();
let installedMappings: VimMapping[] = [];

Vim.defineEx('write', 'w', (editor) => saveCallbacks.get(editor)?.());

export function setVimMappings(mappings: VimMapping[]): void {
    for (const { from, mode } of installedMappings) Vim.unmap(from, mode);

    const nextMappings = new Map<string, VimMapping>();
    for (const mapping of mappings) {
        const from = mapping.from.trim();
        const to = mapping.to.trim();
        if (from && to) nextMappings.set(`${mapping.mode}:${from}`, { ...mapping, from, to });
    }

    installedMappings = [...nextMappings.values()];
    for (const { from, to, mode } of installedMappings) Vim.map(from, to, mode);
}

const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        color: 'var(--kc-editor-fg, #e0e5f1)',
        backgroundColor: 'var(--kc-editor-bg, #11151e)',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--kc-editor-font, ui-monospace, monospace)',
        fontSize: 'var(--kc-editor-size, 14px)',
        lineHeight: 'var(--kc-editor-line-height, 1.65)',
    },
    '.cm-content': { padding: '14px 0', caretColor: 'var(--kc-editor-accent, #a2e6cc)' },
    '.cm-line': { padding: '0 12px' },
    '.cm-gutters': {
        color: 'var(--kc-editor-muted, #8993ab)',
        backgroundColor: 'var(--kc-editor-gutter, #11151e)',
        border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--kc-editor-active-line, #ffffff09)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'var(--kc-editor-selection, #35536b)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--kc-editor-accent, #a2e6cc)' },
    '.cm-panels': {
        color: 'var(--kc-editor-fg, #e0e5f1)',
        backgroundColor: 'var(--kc-editor-gutter, #11151e)',
    },
}, { dark: true });

const highlighting = syntaxHighlighting(HighlightStyle.define([
    { tag: tags.keyword, color: 'var(--kc-syntax-keyword, #d0aaff)' },
    { tag: [tags.string, tags.regexp], color: 'var(--kc-syntax-string, #a2e6cc)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'var(--kc-syntax-number, #efb38e)' },
    { tag: tags.comment, color: 'var(--kc-syntax-comment, #8993ab)' },
    { tag: tags.function(tags.variableName), color: 'var(--kc-syntax-function, #8fbcff)' },
    { tag: [tags.typeName, tags.className], color: 'var(--kc-syntax-type, #8cdbeb)' },
]));

function lineNumber(state: EditorState): number {
    return state.doc.lineAt(state.selection.main.head).number;
}

interface ModeChange {
    mode: string;
    subMode?: 'linewise' | 'blockwise';
}

export function mountEditor(host: HTMLElement, options: EditorOptions) {
    const languageConfig = new Compartment();
    const vimConfig = new Compartment();
    const saveConfig = new Compartment();
    const referenceConfig = new Compartment();
    let language = options.language;
    let vimEnabled = options.vim;
    let saveKey = options.saveKey ?? 'Mod-s';
    let referenceLines = options.inlineReference ?? null;
    let lastLine = 1;
    let adapter: ReturnType<typeof getCM> = null;

    const modeChanged = ({ mode, subMode }: ModeChange) => {
        if (subMode === 'linewise') options.onVimMode(`${mode} line`);
        else if (subMode === 'blockwise') options.onVimMode(`${mode} block`);
        else options.onVimMode(mode);
    };

    function detachVim(): void {
        if (!adapter) return;
        adapter.off('vim-mode-change', modeChanged);
        saveCallbacks.delete(adapter);
        adapter = null;
    }

    function attachVim(view: EditorView): void {
        adapter = getCM(view);
        if (adapter) {
            adapter.on('vim-mode-change', modeChanged);
            saveCallbacks.set(adapter, options.onSave);
        }
        options.onVimMode(adapter ? 'normal' : 'off');
    }

    function reportLine(state: EditorState): void {
        const line = lineNumber(state);
        if (line === lastLine) return;
        lastLine = line;
        options.onLineChange(line);
    }

    function saveBinding() {
        const run = () => {
            options.onSave();
            return true;
        };
        const ctrlOnMac = saveKey.startsWith('Mod-')
            ? [{ mac: `Ctrl-${saveKey.slice(4)}`, preventDefault: true, run }]
            : [];
        // Option+S may produce a different character on macOS.
        const optionKey = saveKey === 'Alt-s' ? EditorView.domEventHandlers({
            keydown(event) {
                return event.code === 'KeyS' && event.altKey && !event.ctrlKey &&
                    !event.metaKey && !event.shiftKey && !event.getModifierState('AltGraph') && run();
            },
        }) : [];
        return Prec.highest([optionKey, keymap.of([
            { key: saveKey, preventDefault: true, run },
            ...ctrlOnMac,
        ])]);
    }

    const extensions = [
        editorTheme,
        highlighting,
        indentUnit.of(indent),
        EditorState.tabSize.of(indent.length),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        EditorView.contentAttributes.of({
            'aria-label': 'Code typing editor',
            'aria-description': editorNavigationDescription,
            autocapitalize: 'off',
            spellcheck: 'false',
        }),
        EditorView.domEventObservers({
            keydown(event, view) {
                // Observe Escape before Vim handles it so CodeMirror still releases Tab.
                if (event.key === 'Escape') view.setTabFocusMode(2000);
            },
        }),
        keymap.of([
            {
                key: 'Tab',
                run(view) {
                    const vimState = getCM(view)?.state.vim;
                    if (vimState && !vimState.insertMode) return false;
                    view.dispatch(view.state.replaceSelection(indent), {
                        scrollIntoView: true,
                        userEvent: 'input.type',
                    });
                    return true;
                },
            },
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                let inserted = 0;
                let deleted = 0;
                const lines = new Map<number, number>();
                update.changes.iterChanges((from, to, fromNew, toNew, text) => {
                    inserted += text.length;
                    deleted += to - from;
                    // Attribute removals to the lines they came from, including removed newlines.
                    for (let pos = from; pos < to;) {
                        const line = update.startState.doc.lineAt(pos);
                        const end = Math.min(line.to + 1, to);
                        lines.set(line.number, (lines.get(line.number) ?? 0) + end - pos);
                        pos = end;
                    }
                    for (let pos = fromNew; pos < toNew;) {
                        const line = update.state.doc.lineAt(pos);
                        if (!lines.has(line.number)) lines.set(line.number, 0);
                        pos = line.to + 1;
                    }
                });
                const paste = update.transactions.some((transaction) =>
                    transaction.isUserEvent('input.paste') || transaction.isUserEvent('input.drop'));
                options.onChange(update.state.doc.toString(), {
                    inserted, deleted, paste,
                    lines: Array.from(lines, ([line, deleted]) => ({ line, deleted })),
                });
            }
            if (update.docChanged || update.selectionSet) reportLine(update.state);
        }),
    ];

    const createState = (doc = '') => EditorState.create({
        doc,
        extensions: [
            vimConfig.of(vimEnabled ? vim() : []),
            languageConfig.of(languageExtensions[getLanguage(language).editor]()),
            saveConfig.of(saveBinding()),
            referenceConfig.of(inlineReference(referenceLines)),
            extensions,
        ],
    });
    const view = new EditorView({ parent: host, state: createState() });
    attachVim(view);
    options.onLineChange(lastLine);

    return {
        getValue: () => view.state.doc.toString(),
        getLine: () => lineNumber(view.state),
        goToLine(line: number): void {
            const requested = Number.isFinite(line) ? Math.trunc(line) : 1;
            const bounded = Math.max(1, Math.min(requested, view.state.doc.lines));
            const { from } = view.state.doc.line(bounded);
            view.dispatch({ selection: { anchor: from }, scrollIntoView: true });
            view.focus();
        },
        setValue(value: string): void {
            detachVim();
            // A fresh history prevents undo from restoring the previous attempt.
            view.setState(createState(value));
            view.scrollDOM.scrollTo(0, 0);
            attachVim(view);
            reportLine(view.state);
        },
        setLanguage(next: EditorLanguage): void {
            if (language === next) return;
            language = next;
            view.dispatch({ effects: languageConfig.reconfigure(languageExtensions[getLanguage(language).editor]()) });
        },
        setInlineReference(lines: readonly string[] | null): void {
            if (referenceLines === lines) return;
            referenceLines = lines;
            view.dispatch({ effects: referenceConfig.reconfigure(inlineReference(lines)) });
        },
        setVim(enabled: boolean): void {
            if (vimEnabled === enabled) return;
            detachVim();
            vimEnabled = enabled;
            view.dispatch({ effects: vimConfig.reconfigure(vimEnabled ? vim() : []) });
            attachVim(view);
        },
        setSaveKey(key: string): void {
            if (saveKey === key) return;
            saveKey = key;
            view.dispatch({ effects: saveConfig.reconfigure(saveBinding()) });
        },
        focus: () => view.focus(),
        destroy(): void {
            detachVim();
            view.destroy();
        },
    };
}
