import monacoLoader from '@monaco-editor/loader';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { SyntheticEvent, useEffect, useState } from 'react';

import { LanguageProvider } from '../../src/language-provider';
import { ThemeProvider } from '../../src/theme-provider';
import Editor from './editor';

export interface EditorContext {
  instance?: Monaco.editor.IStandaloneCodeEditor;
  model: Monaco.editor.ITextModel;
  themeProvider: ThemeProvider;
  monaco: typeof Monaco;
}

export interface EditorRootOptions {
  onCreate?: (context: EditorContext) => void;
}

export function EditorRoot({ onCreate }: EditorRootOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );

  const onLanguageChange = (e) => {
    if (editorContext === null) {
      return;
    }

    const language = e.target.value;
    let example = '';

    switch (language) {
      case 'greyscript':
        example = 'print("hello world")';
        break;
      case 'javascript':
        example = 'console.log("hello world")';
        break;
    }

    const model = editorContext.monaco.editor.createModel(
      example,
      language
    );

    console.log(model);

    setEditorContext({
      ...editorContext,
      model
    });
  };

  const onThemeChange = (e) => {
    if (editorContext === null) {
      return;
    }

    const themeName = e.target.value;
    editorContext.themeProvider.setTheme(themeName);
  };

  const onLoad = async (resolvedMonaco: typeof Monaco) => {
    resolvedMonaco.languages.register({ id: 'greyscript' });

    const languageProvider = new LanguageProvider({
      monaco: resolvedMonaco,
      wasm: new URL(
        'https://unpkg.com/vscode-oniguruma@1.7.0/release/onig.wasm'
      ),
      grammarSourceMap: {
        greyscript: {
          scopeName: 'source.src',
          tmLanguageFile: new URL(
            'https://unpkg.com/greyscript-textmate@1.0.6/dist/greyscript.tmLanguage.json'
          ),
          languageConfigurationFile: new URL(
            'https://unpkg.com/greyscript-textmate@1.0.6/dist/greyscriptLanguageConfig.json'
          )
        },
        javascript: {
          scopeName: 'source.js',
          tmLanguageFile: new URL(
            'http://localhost:5173/assets/javascript.tmLanguage.json'
          ),
          languageConfigurationFile: new URL(
            'http://localhost:5173/assets/javascript-language-configuration.json'
          )
        }
      }
    });

    const themeProvider = new ThemeProvider({
      monaco: resolvedMonaco,
      registry: (await languageProvider.getRegistry())!,
      themeSources: {
        default: new URL(
          'https://unpkg.com/greyscript-textmate@1.0.6/dist/greyscript.theme.json'
        ),
        github: new URL(
          'http://localhost:5173/assets/github-dark.json'
        )
      }
    });

    const model = resolvedMonaco.editor.createModel(
      'print("hello world")',
      'greyscript'
    );

    themeProvider.setTheme('default');

    setEditorContext({
      monaco: resolvedMonaco,
      themeProvider,
      model
    });
  };

  useEffect(() => {
    monacoLoader.init().then((M) => onLoad(M));
  }, []);

  if (editorContext === null) {
    return <div className="editor-root">Loading</div>;
  }

  return (
    <div className="editor-root">
      <select className="editor-language" onChange={onLanguageChange}>
        <option value="greyscript">GreyScript</option>
        <option value="javascript">JavaScript</option>
      </select>
      <select className="editor-theme" onChange={onThemeChange}>
        <option value="default">Default</option>
        <option value="github">GitHub</option>
      </select>
      <Editor
        model={editorContext.model}
        monaco={editorContext.monaco}
        onCreate={(instance) => {
          const newContext = {
            ...editorContext,
            instance
          };

          setEditorContext(newContext);
          onCreate?.(newContext);
        }}
      />
    </div>
  );
}
