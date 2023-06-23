import monaco from 'monaco-editor/esm/vs/editor/editor.api';

export interface LanguageConfigurationFileOptions {
  languageConfiguration: monaco.languages.LanguageConfiguration;
}

export class LanguageConfigurationFile {
  private languageConfiguration: monaco.languages.LanguageConfiguration;

  static async loadFrom(source: URL) {
    const res = await fetch(source);
    const languageConfiguration = await res.json() as monaco.languages.LanguageConfiguration;

    return new LanguageConfigurationFile({ languageConfiguration });
  }

  constructor(options: LanguageConfigurationFileOptions) {
    this.languageConfiguration = options.languageConfiguration;
  }

  toRaw(): monaco.languages.LanguageConfiguration {
    return this.languageConfiguration;
  }
}