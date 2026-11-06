interface LanguageDefinition {
    id: string;
    name: string;
    shortName: string;
    extension: string;
    editor: string;
    repair?: {
        runtime: 'javascript';
        prepare(source: string): string | Promise<string>;
    };
}

async function transpileTypeScript(source: string) {
    const ts = await import('typescript');
    const { outputText, diagnostics } = ts.transpileModule(source, {
        fileName: 'repair.ts',
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
        reportDiagnostics: true,
    });
    const error = diagnostics?.find((entry) => entry.category === ts.DiagnosticCategory.Error);
    if (error) {
        const message = ts.flattenDiagnosticMessageText(error.messageText, ' ');
        const line = error.file && error.start !== undefined
            ? error.file.getLineAndCharacterOfPosition(error.start).line + 1
            : undefined;
        throw new Error(line === undefined ? message : `Line ${line}: ${message}`);
    }
    return outputText;
}

const definitions = [
    {
        id: 'js', name: 'JavaScript', shortName: 'JS', extension: 'js',
        editor: 'javascript',
        repair: { runtime: 'javascript', prepare: (source: string) => source },
    },
    {
        id: 'ts', name: 'TypeScript', shortName: 'TS', extension: 'ts',
        editor: 'typescript',
        repair: { runtime: 'javascript', prepare: transpileTypeScript },
    },
] as const satisfies readonly LanguageDefinition[];

export type Language = typeof definitions[number]['id'];
export type EditorAdapter = typeof definitions[number]['editor'];
export type LanguageSources = Partial<Record<Language, string>>;
type RegisteredLanguage = LanguageDefinition & { id: Language; editor: EditorAdapter };

export const languages: readonly RegisteredLanguage[] = definitions;
export const defaultLanguage: Language = 'js';

const byId = new Map(languages.map((language) => [language.id, language]));

export function isLanguage(value: unknown): value is Language {
    return languages.some(({ id }) => id === value);
}

export function getLanguage(id: Language): RegisteredLanguage {
    return byId.get(id)!;
}

export const repairLanguages = languages.filter(({ repair }) => repair?.runtime === 'javascript').map(({ id }) => id);

export function solutionLanguages(solutions: LanguageSources): Language[] {
    return languages.map(({ id }) => id).filter((id) => Boolean(solutions[id]));
}

export function repairStarterLanguages(starter: LanguageSources): Language[] {
    return repairLanguages.filter((id) => typeof starter[id] === 'string');
}
