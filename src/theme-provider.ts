import monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Registry } from 'vscode-textmate';

import { Theme } from './theme-provider/theme';

export interface ThemeProviderOptions {
  registry: Registry;
  monaco: typeof monaco;
  themeSources: Record<string, URL>;
}

export class ThemeProvider {
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
  }

  public async setTheme(id: string) {
    if (this.themes.has(id)) {
      this.setEditorTheme(id);
      return;
    }
    const theme = await this.loadTheme(id);
    this.registry.setTheme(theme.toRawTheme());
    this.monaco.editor.setTheme(id);
    this.injectCSS();
  }

  public setEditorTheme(id: string) {
    if (this.currentTheme !== id) {
      this.monaco.editor.setTheme(id);
      this.currentTheme = id;
    }
  }

  private async loadTheme(id: string): Promise<Theme> {
    if (this.themes.has(id)) return this.themes.get(id);
    const theme = await Theme.loadFrom(this.themeSources[id]);
    this.monaco.editor.defineTheme(id, theme.toThemeData());
    this.themes.set(id, theme);
    return theme;
  }

  private disposeCSS() {
    this.style?.remove();
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

    this.disposeCSS();

    const css = generateTokensCSSForColorMap(colorMap);
    this.style = this.createStyleElementForColorsCSS();

    this.style.innerHTML = css;
  }

  public createStyleElementForColorsCSS() {
    const style = document.createElement('style');
    style.id = 'monaco-textmate-colors-css';
    const monacoColors = document.querySelector('.monaco-colors');

    if (monacoColors) {
      monacoColors.parentElement?.insertBefore(style, monacoColors.nextSibling);
    } else {
      const { head = document.querySelector('head') } = document;
      head?.appendChild(style);
    }

    return style;
  }

  public dispose() {
    document.querySelector('#monaco-textmate-colors-css')?.remove();
  }
}
