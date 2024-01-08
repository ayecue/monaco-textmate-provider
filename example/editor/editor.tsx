import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useRef, useState } from 'react';

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
  const [instance, setInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const newInstance = monaco.editor.create(editorRef.current!, {
      model,
      automaticLayout: true,
      theme: 'vs-dark'
    });

    onCreate(newInstance);
    setInstance(newInstance);
  }, []);

  useEffect(() => {
    if (instance !== null) {
      instance.setModel(model);
    }
  }, [instance, model]);

  return <div className="editor-ide" ref={editorRef}></div>;
}
