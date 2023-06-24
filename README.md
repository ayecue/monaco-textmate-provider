# monaco-textmate-provider

Language Provider and Theme Provider for Textmate within monaco.

# Usage

```ts
const onLoad = async (resolvedMonaco: typeof Monaco) => {
  resolvedMonaco.languages.register({ id: 'myLanguage' });

  const languageProvider = new LanguageProvider({
    monaco: resolvedMonaco,
    wasm: 'https://unpkg.com/vscode-oniguruma@1.7.0/release/onig.wasm',
    grammars: {
      greyscript: {
        scopeName: 'source.src',
        tmLanguageFile: 'https://unpkg.com/my-package@1.0.0/dist/myLanguage.tmLanguage.json',
        languageConfigurationFile: 'https://unpkg.com/my-package@1.0.0/dist/myLanguageConfig.json',
      },
    },
  });
  
  const themeProvider = new ThemeProvider({
    monaco: resolvedMonaco,
    registry: await languageProvider.getRegistry(),
    themes: {
      default: 'https://unpkg.com/my-package@1.0.0/dist/myLanguage.theme.json',
    }
  });

  const model = resolvedMonaco.editor.createModel(
    initialContent,
    'myLanguage'
  );

  themeProvider.setTheme('default');
};
```

For additional usage information, you can take a look at the provided [example code](/example).

# Credits

- Thanks to @bolinfest for [monaco-tm](https://github.com/bolinfest/monaco-tm)