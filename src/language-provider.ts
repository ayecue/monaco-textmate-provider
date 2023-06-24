import monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  createOnigScanner,
  createOnigString,
  loadWASM
} from 'vscode-oniguruma';
import { INITIAL, Registry, StateStack } from 'vscode-textmate';

import { GrammarSourceMap } from './language-provider/grammar-sources';
import { LanguageConfigurationFile } from './language-provider/language-configuration-file';
import { TMLanguageFile } from './language-provider/tm-language-file';

export interface LanguageProviderOptions {
  monaco: typeof monaco;
  wasm: URL;
  grammarSourceMap: GrammarSourceMap;
}

let isLoadedWASM = false;

export type LanguageInfo = {
  tokensProvider: monaco.languages.EncodedTokensProvider | null;
  configuration: monaco.languages.LanguageConfiguration | null;
};

export class LanguageProvider {
  private monaco: typeof monaco;
  private wasm: URL;
  private registry: Registry | null = null;
  private grammarSourceMap: GrammarSourceMap;
  private scopeToSourceMapRef: Record<string, string>;
  private disposes: monaco.IDisposable[] = [];

  constructor(options: LanguageProviderOptions) {
    this.monaco = options.monaco;
    this.wasm = options.wasm;
    this.grammarSourceMap = options.grammarSourceMap;
    this.scopeToSourceMapRef = Object.entries(options.grammarSourceMap).reduce(
      (result, [key, value]) => {
        return {
          ...result,
          [value.scopeName]: key
        };
      },
      {}
    );
  }

  public async getRegistry() {
    if (this.registry === null) {
      await this.loadRegistry();
    }
    return this.registry;
  }

  private bindLanguage() {
    for (const [languageId, item] of Object.entries(this.grammarSourceMap)) {
      if (item.extra) {
        this.monaco.languages.register(item.extra);
      }
      const dispose = this.monaco.languages.onLanguage(languageId, () =>
        this.registerLanguage(languageId)
      );
      this.disposes.push(dispose);
    }
  }

  private async loadRegistry() {
    if (!isLoadedWASM) {
      await loadWASM(await this.loadVSCodeOnigurumWASM());
      isLoadedWASM = true;
    }
    const registry = new Registry({
      onigLib: Promise.resolve({
        createOnigScanner,
        createOnigString
      }),
      loadGrammar: async (scopeName) => {
        const key = this.scopeToSourceMapRef[scopeName];
        const grammarSource = this.grammarSourceMap[key];
        if (grammarSource) {
          const tmLanguageFile = await TMLanguageFile.loadFrom(
            grammarSource.tmLanguageFile
          );
          return tmLanguageFile.toRaw();
        }
        return Promise.resolve(null);
      }
    });

    this.registry = registry;

    this.bindLanguage();
  }

  private async registerLanguage(languageId: string) {
    const { tokensProvider, configuration } = await this.fetchLanguageInfo(
      languageId
    );

    if (configuration !== null) {
      this.monaco.languages.setLanguageConfiguration(languageId, configuration);
    }

    if (tokensProvider !== null) {
      this.monaco.languages.setTokensProvider(languageId, tokensProvider);
    }
  }

  private async fetchLanguageInfo(languageId: string): Promise<LanguageInfo> {
    const [configuration, tokensProvider] = await Promise.all([
      this.getConfiguration(languageId),
      this.getTokensProvider(languageId)
    ]);

    return { configuration, tokensProvider };
  }

  private async getConfiguration(
    languageId: string
  ): Promise<monaco.languages.LanguageConfiguration | null> {
    const grammar = this.grammarSourceMap[languageId];
    if (grammar.languageConfigurationFile) {
      const languageConfigurationFile =
        await LanguageConfigurationFile.loadFrom(
          grammar.languageConfigurationFile
        );
      return languageConfigurationFile.toRaw();
    }
    return Promise.resolve(null);
  }

  private async getTokensProvider(
    languageId: string
  ): Promise<monaco.languages.EncodedTokensProvider | null> {
    const scopeName = this.getScopeNameFromLanguageId(languageId);
    const grammar = await this.registry.loadGrammar(scopeName);

    if (!grammar) return null;

    return {
      getInitialState() {
        return INITIAL;
      },
      tokenizeEncoded(
        line: string,
        state: monaco.languages.IState
      ): monaco.languages.IEncodedLineTokens {
        const tokenizeLineResult2 = grammar.tokenizeLine2(
          line,
          state as StateStack
        );
        const { tokens, ruleStack: endState } = tokenizeLineResult2;
        return { tokens, endState };
      }
    };
  }

  private getScopeNameFromLanguageId(languageId: string) {
    if (this.grammarSourceMap[languageId]?.scopeName) {
      return this.grammarSourceMap[languageId].scopeName;
    }
    throw new Error(`can not find scopeName with languageId: ${languageId}`);
  }

  private async loadVSCodeOnigurumWASM() {
    const response = await fetch(this.wasm);
    const contentType = response.headers.get('content-type');
    if (contentType === 'application/wasm') {
      return response;
    }
    return await response.arrayBuffer();
  }

  public dispose() {
    this.disposes.forEach((d) => d.dispose());
    this.registry?.dispose();
  }
}
