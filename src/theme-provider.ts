import monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Registry } from 'vscode-textmate';

import { Theme } from './theme-provider/theme';

export interface ThemeProviderOptions {
  registry: Registry;
  monaco: typeof monaco;
  themeSources: Record<string, URL>;
}

export class ThemeProvider {
  static MONACO_STYLE_SELECTOR = '.monaco-colors' as const;

  private themes = new Map<string, Theme>();
  private themeSources: Record<string, URL>;
  private registry: Registry;
  private monaco: typeof monaco;
  private currentTheme: string | null = null;
  private style: HTMLStyleElement | null = null;

  constructor(options: ThemeProviderOptions) {
    this.registry = options.registry;
    this.monaco = options.monaco;
    this.themeSources = options.themeSources;

    this.monaco.editor.onDidCreateEditor(this.injectCSS.bind(this));
  }

  public getThemeId(): string {
    return this.currentTheme;
  }

  public async setTheme(id: string) {
    if (this.currentTheme === id) {
      return;
    }
    const theme = this.themes.has(id) ? this.themes.get(id)! : await this.loadTheme(id);
    this.registry.setTheme(theme.toRawTheme());
    this.monaco.editor.setTheme(id);
    this.currentTheme = id;
    this.injectCSS();
  }

  private async loadTheme(id: string): Promise<Theme> {
    if (this.themes.has(id)) return this.themes.get(id);
    const theme = await Theme.loadFrom(this.themeSources[id]);
    this.monaco.editor.defineTheme(id, theme.toThemeData());
    this.themes.set(id, theme);
    return theme;
  }

  private getMonacoStyle(): Element | null {
    return document.querySelector(ThemeProvider.MONACO_STYLE_SELECTOR) ?? null;
  }

  public injectCSS() {
    if (this.currentTheme === null) {
      return;
    }

    const monacoColors = this.getMonacoStyle();

    if (monacoColors === null) {
      return;
    }

    const cssColors = this.registry.getColorMap();
    const { Color } = window.require('vs/base/common/color');
    const { TokenizationRegistry } = window.require(
      'vs/editor/common/languages'
    );
    const { generateTokensCSSForColorMap } = window.require(
      'vs/editor/common/languages/supports/tokenization'
    );
    const colorMap = cssColors.map(Color.Format.CSS.parseHex);

    TokenizationRegistry.setColorMap(colorMap);

    this.dispose();

    this.style = document.createElement('style');
    this.style.innerHTML = generateTokensCSSForColorMap(colorMap);

    monacoColors.parentElement!.insertBefore(this.style, monacoColors.nextSibling);
  }

  public dispose() {
    this.style?.remove();
    this.style = null;
  }
}
