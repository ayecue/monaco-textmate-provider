import monaco from 'monaco-editor/esm/vs/editor/editor.api';

export interface GrammarSource {
  scopeName: string;
  tmLanguageFile: URL;
  languageConfigurationFile?: URL;
  extra?: monaco.languages.ILanguageExtensionPoint;
}

export type GrammarSourceMap = Record<string, GrammarSource>;
