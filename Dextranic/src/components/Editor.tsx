"use client";

import React, { useRef, useEffect } from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';

interface EditorProps {
  value: string;
  path: string;
  onChange: (value: string | undefined) => void;
}

export const Editor: React.FC<EditorProps> = ({ value, path, onChange }) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('dextranicTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'identifier', foreground: 'f8fafc' },
        { token: 'delimiter', foreground: '94a3b8' }
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#cbd5e1',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editor.lineHighlightBackground': '#1e293b',
      }
    });
    monaco.editor.setTheme('dextranicTheme');
  };
  useEffect(() => {
    const handleJump = (e: any) => {
      const line = e.detail?.line;
      if (line && editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
        editorRef.current.focus();
      }
    };
    const handleSnippet = (e: any) => {
      const snippet = e.detail?.snippet;
      if (snippet && editorRef.current) {
        const selection = editorRef.current.getSelection();
        const range = {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        };
        editorRef.current.executeEdits("snippet-insert", [
          { range: range, text: snippet, forceMoveMarkers: true }
        ]);
        editorRef.current.focus();
      }
    };
    window.addEventListener('editor-jump-to-line', handleJump);
    window.addEventListener('insert-editor-snippet', handleSnippet);
    return () => {
      window.removeEventListener('editor-jump-to-line', handleJump);
      window.removeEventListener('insert-editor-snippet', handleSnippet);
    };
  }, []);

  useEffect(() => {
    if (monaco) {
      monaco.languages.register({ id: 'dextranic' });
      monaco.languages.setMonarchTokensProvider('dextranic', {
        tokenizer: {
          root: [
            [/(presentation|theme|slide|image|video|bullets|title|src|width|align|autoplay|table|chart|text|code|equation|diagram)\b/, 'keyword'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            [/[{}()[\]]/, '@brackets'],
            [/[A-Za-z_$][\w$]*/, 'identifier'],
            [/[ \t\r\n]+/, 'white'],
            [/[:,.]/, 'delimiter'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
          ],
        }
      });

      monaco.languages.registerCompletionItemProvider('dextranic', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions = [
            {
              label: 'slide',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'slide {\n\ttitle: "${1:Slide Title}"\n\tbullets {\n\t\t"${2:Bullet point 1}"\n\t\t"${3:Bullet point 2}"\n\t}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Standard Slide block with Title and Bullet list',
              range: range
            },
            {
              label: 'theme',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'theme {\n\tprimary: "${1:#0f172a}"\n\tsecondary: "${2:#38bdf8}"\n\tfont: "${3:Poppins}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Global Theme styling',
              range: range
            },
            {
              label: 'text',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'text {\n\tcontent: "${1:Custom styled content}"\n\tsize: "${2:24}"\n\tcolor: "${3:#38bdf8}"\n\talign: "${4:center}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Rich text slide component block',
              range: range
            },
            {
              label: 'image',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'image {\n\tsrc: "${1:./assets/logo.png}"\n\twidth: "${2:450}"\n\talign: "${3:center}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Slide Image visual',
              range: range
            },
            {
              label: 'bullets',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'bullets {\n\t"${1:Point one}"\n\t"${2:Point two}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Bullet points structure list',
              range: range
            },
            {
              label: 'table',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'table {\n\theaders: "${1:Metric, Standard Slides, Dextranic}"\n\trows: "${2:Editable shapes | No | Yes; Custom branding | No | Yes}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Data or comparison tables block component',
              range: range
            },
            {
              label: 'chart',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'chart {\n\ttype: "${1:bar}"\n\ttitle: "${2:Quarterly Performance}"\n\tlabels: "${3:Q1, Q2, Q3, Q4}"\n\tdata: "${4:45, 60, 50, 75}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'SVG interactive and native PPTX chart component',
              range: range
            },
            {
              label: 'diagram',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'diagram flowchart {\n\t"${1:Input}" -> "${2:Process}"\n\t"${2:Process}" -> "${3:Output}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Flowchart diagram edges flow',
              range: range
            },
            {
              label: 'code',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'code {\n\tlanguage: "${1:typescript}"\n\tcontent: "${2:const dextranic = true;}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Syntax-highlighted monospace code box',
              range: range
            },
            {
              label: 'equation',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'equation {\n\tformula: "${1:\\\\int_a^b f(x)\\\\,dx = F(b) - F(a)}"\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'LaTeX algebraic math equation block',
              range: range
            }
          ];
          return { suggestions };
        }
      });
    }
  }, [monaco]);

  return (
    <div style={{ flex: 1, height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        language="dextranic"
        path={path}
        theme={monaco ? "dextranicTheme" : "vs-dark"}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          padding: { top: 16 },
          scrollBeyondLastLine: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          wordWrap: 'on'
        }}
      />
    </div>
  );
};
