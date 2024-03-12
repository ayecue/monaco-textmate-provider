import monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { IRawTheme } from 'vscode-textmate';

export type ThemePayloadColorMap = Record<string, string>;
export type ThemePayloadTokenColorSettings = Record<string, string>;

export type ThemePayloadTokenColor = {
  scope?: string | string[];
  settings: ThemePayloadTokenColorSettings;
};

export interface ThemePayload {
  $schema: string;
  name: string;
  type: string;
  colors?: ThemePayloadColorMap;
  tokenColors: ThemePayloadTokenColor[];
}

export interface ThemeOptions {
  name: string;
  settings: ThemePayloadTokenColor[];
  colors: ThemePayloadColorMap;
}

export class Theme {
  static BASE_THEME = 'vs-dark' as const;

  private name: string;
  private settings: ThemePayloadTokenColor[];
  private colors: ThemePayloadColorMap;

  static async loadFrom(source: URL) {
    const payload = await fetch(source.toString());
    const { name, tokenColors, colors }: ThemePayload = await payload.json();
    const res = new Theme({
      name,
      settings: [
        ...(colors
          ? [
              {
                settings: {
                  foreground: colors['editor.foreground'],
                  background: colors['editor.background']
                }
              }
            ]
          : []),
        ...tokenColors
      ],
      colors
    });

    return res;
  }

  constructor(options: ThemeOptions) {
    this.name = options.name;
    this.settings = options.settings;
    this.colors = options.colors;
  }

  toThemeData(): monaco.editor.IStandaloneThemeData {
    return {
      base: Theme.BASE_THEME,
      inherit: true,
      rules: [
        {
          token: '',
          ...this.settings[0]
        }
      ],
      colors: this.colors
    };
  }

  toRawTheme(): IRawTheme {
    return {
      name: this.name,
      settings: this.settings
    };
  }
}
