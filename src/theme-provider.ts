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

  private monacoColorObserver: MutationObserver | null = null;
  private style: HTMLStyleElement | null = null;

  constructor(options: ThemeProviderOptions) {
    this.registry = options.registry;
    this.monaco = options.monaco;
    this.themeSources = options.themeSources;
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

  public injectCSS() {
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

    const css = generateTokensCSSForColorMap(colorMap);
    this.style = this.createStyleElementForColorsCSS();
    this.style.innerHTML = css;
  }

  public createStyleElementForColorsCSS() {
    const style = document.createElement('style');
    const monacoColors = document.querySelector(ThemeProvider.MONACO_STYLE_SELECTOR);

    if (monacoColors) {
      monacoColors.parentElement?.insertBefore(style, monacoColors.nextSibling);
    } else {
      const header = document.querySelector('head');

      // observe header for .monaco-colors appearance to reinject styles
      this.monacoColorObserver = new MutationObserver(() => {
        const monacoColors = document.querySelector(ThemeProvider.MONACO_STYLE_SELECTOR);
        if (monacoColors) this.injectCSS()
      });
      this.monacoColorObserver.observe(header, { childList: true });

      // temporarily append style
      header?.appendChild(style);
    }

    return style;
  }

  public dispose() {
    this.monacoColorObserver?.disconnect();
    this.monacoColorObserver = null;
    this.style?.remove();
    this.style = null;
  }
}
