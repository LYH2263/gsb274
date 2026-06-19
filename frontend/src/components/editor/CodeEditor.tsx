'use client';

import { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  onSelectionChange?: (selection: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
  height?: string;
}

export default function CodeEditor({
  value,
  language,
  onChange,
  onCursorChange,
  onSelectionChange,
  readOnly = false,
  theme = 'vs-dark',
  height = '100%',
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;

    // 监听光标变化
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.position.lineNumber - 1,
          column: e.position.column - 1,
        });
      }
    });

    // 监听选择变化
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        const selection = e.selection;
        onSelectionChange({
          startLine: selection.startLineNumber - 1,
          startColumn: selection.startColumn - 1,
          endLine: selection.endLineNumber - 1,
          endColumn: selection.endColumn - 1,
        });
      }
    });
  }, [onCursorChange, onSelectionChange]);

  const handleChange: OnChange = useCallback((newValue) => {
    if (onChange && newValue !== undefined) {
      onChange(newValue);
    }
  }, [onChange]);

  // 外部控制编辑器内容
  useEffect(() => {
    if (editorRef.current && readOnly) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value, readOnly]);

  // 获取语言映射
  const getLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      csharp: 'csharp',
      'c#': 'csharp',
      go: 'go',
      rust: 'rust',
      ruby: 'ruby',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'markdown',
      sql: 'sql',
      shell: 'shell',
      bash: 'shell',
    };
    return languageMap[lang.toLowerCase()] || 'plaintext';
  };

  return (
    <div className="monaco-editor-container" style={{ height }}>
      <Editor
        height="100%"
        language={getLanguage(language)}
        value={value}
        theme={theme}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          mouseWheelZoom: true,
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      />
    </div>
  );
}
