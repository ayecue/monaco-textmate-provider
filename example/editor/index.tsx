import monacoLoader from '@monaco-editor/loader';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useState } from 'react';

import { LanguageProvider } from '../../src/language-provider';
import { ThemeProvider } from '../../src/theme-provider';
import Editor from './editor';

export interface EditorContext {
  instance?: Monaco.editor.IStandaloneCodeEditor;
  model: Monaco.editor.ITextModel;
  monaco: typeof Monaco;
}

export interface EditorRootOptions {
  onCreate?: (context: EditorContext) => void;
}

export function EditorRoot({ onCreate }: EditorRootOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );

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
        }
      }
    });

    const themeProvider = new ThemeProvider({
      monaco: resolvedMonaco,
      registry: (await languageProvider.getRegistry())!,
      themeSources: {
        default: new URL(
          'https://unpkg.com/greyscript-textmate@1.0.6/dist/greyscript.theme.json'
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
