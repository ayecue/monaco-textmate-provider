import {
  IRawGrammar,
  parseRawGrammar
} from 'vscode-textmate';

export interface TMLanguageFileOptions {
  grammar: IRawGrammar;
}

export class TMLanguageFile {
  private grammar: IRawGrammar;

  static async loadFrom(source: URL) {
    const res = await fetch(source);
    const grammar = parseRawGrammar(await res.text(), source.pathname);

    return new TMLanguageFile({ grammar });
  }

  constructor(options: TMLanguageFileOptions) {
    this.grammar = options.grammar;
  }

  toRaw(): IRawGrammar {
    return this.grammar;
  }
}