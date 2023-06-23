import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useRef } from 'react';

export interface EditorOptions {
  model: Monaco.editor.ITextModel;
  monaco: typeof Monaco;
  onCreate: (instance: Monaco.editor.IStandaloneCodeEditor) => void;
  className?: string;
}

export default function Editor({
  monaco,
  model,
  onCreate,
  className
}: EditorOptions) {
  const editorRef = useRef(null);

  useEffect(() => {
    const instance = monaco.editor.create(editorRef.current!, {
      model,
      automaticLayout: true,
      theme: 'vs-dark'
    });

    onCreate(instance);
  }, []);

  return (
    <div
      className='editor-ide'
      ref={editorRef}
    ></div>
  );
}
