import { countColumn, StateField, type EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';

export const editorNavigationDescription = 'Press Escape then Tab to leave the editor.';

type CueKind = 'Suffix' | 'Correction' | 'Preview';

class ReferenceCue extends WidgetType {
    constructor(readonly text: string, readonly kind: CueKind) {
        super();
    }

    eq(other: ReferenceCue): boolean {
        return this.text === other.text && this.kind === other.kind;
    }

    toDOM(view: EditorView): HTMLElement {
        const cue = view.dom.ownerDocument.createElement(this.kind === 'Suffix' ? 'span' : 'div');
        cue.className = `cm-inlineReference cm-inlineReference${this.kind}`;
        cue.setAttribute('aria-hidden', 'true');
        cue.textContent = this.text;
        return cue;
    }
}

const cueTheme = EditorView.theme({
    '.cm-inlineReference': {
        whiteSpace: 'break-spaces',
        overflowWrap: 'anywhere',
        pointerEvents: 'none',
        userSelect: 'none',
        color: 'var(--kc-editor-muted, #8993ab)',
    },
    '.cm-inlineReferenceCorrection, .cm-inlineReferencePreview': { paddingInline: '12px' },
    '.cm-inlineReferenceCorrection::before': {
        content: '"↳ Target  "',
        color: 'var(--kc-editor-accent, #a2e6cc)',
    },
    '.cm-inlineReferencePreview': {
        color: 'color-mix(in srgb, var(--kc-editor-muted, #8993ab) 75%, var(--kc-editor-bg, #11151e))',
    },
});

function activeLine(state: EditorState) {
    return state.doc.lineAt(state.selection.main.head);
}

function referenceDecorations(state: EditorState, lines: readonly string[]): DecorationSet {
    const line = activeLine(state);
    const expected = lines[line.number - 1];
    if (expected === undefined) return Decoration.none;

    const typedCode = line.text.trimStart();
    const expectedCode = expected.trimStart();
    const matches = typedCode.trimEnd() === expectedCode.trimEnd();
    const cues = [];

    if (!expectedCode && matches) {
        cues.push(Decoration.widget({ widget: new ReferenceCue('↵ Blank line', 'Suffix'), side: 1 }).range(line.to));
    } else if (!matches) {
        if (expectedCode.startsWith(typedCode)) {
            // Keep reference indentation visible until the user types it or starts the code.
            const typedIndent = line.text.slice(0, line.text.length - typedCode.length);
            const expectedIndent = expected.slice(0, expected.length - expectedCode.length);
            const spaces = typedCode ? 0 : Math.max(0,
                countColumn(expectedIndent, state.tabSize) - countColumn(typedIndent, state.tabSize));
            const suffix = ' '.repeat(spaces) + expectedCode.slice(typedCode.length);
            cues.push(Decoration.widget({ widget: new ReferenceCue(suffix, 'Suffix'), side: 1 }).range(line.to));
        } else {
            cues.push(Decoration.widget({
                widget: new ReferenceCue(expectedCode ? expected : 'Blank line', 'Correction'),
                side: 1,
                block: true,
            }).range(line.to));
        }
    }

    if (line.number === state.doc.lines) {
        lines.slice(line.number, line.number + 2).forEach((text, index) => {
            cues.push(Decoration.widget({
                widget: new ReferenceCue(text || '\u00a0', 'Preview'),
                side: index + 2,
                block: true,
            }).range(line.to));
        });
    }
    return Decoration.set(cues, true);
}

export function inlineReference(lines: readonly string[] | null): Extension {
    if (!lines?.length) return [];

    const decorations = StateField.define<DecorationSet>({
        create: (state) => referenceDecorations(state, lines),
        update(cues, transaction) {
            if (transaction.docChanged || activeLine(transaction.startState).number !== activeLine(transaction.state).number) {
                return referenceDecorations(transaction.state, lines);
            }
            return cues;
        },
        provide: (field) => EditorView.decorations.from(field),
    });

    return [
        cueTheme,
        EditorView.lineWrapping,
        decorations,
        EditorView.contentAttributes.of(({ state }) => {
            const line = activeLine(state).number;
            const target = lines[line - 1]?.trim();
            if (target === undefined) return null;
            return { 'aria-description': `Line ${line} target: ${target || 'blank line'}. ${editorNavigationDescription}` };
        }),
    ];
}
