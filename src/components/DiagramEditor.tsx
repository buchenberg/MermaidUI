import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";
import DiagramPreview from "./DiagramPreview";
import ResizableSplit from "./ResizableSplit";
import registerMermaidLanguage from "monaco-mermaid";
import * as api from "../api";
import { useTheme } from "../ThemeContext";

interface DiagramEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  zoomLevel: number;
}

export interface DiagramEditorRef {
  exportSvg: (name: string) => Promise<void>;
}

const DiagramEditor = forwardRef<DiagramEditorRef, DiagramEditorProps>(
  ({ content, onContentChange, zoomLevel }, ref) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const { theme } = useTheme();

    useImperativeHandle(ref, () => ({
      exportSvg: async (name: string) => {
        if (!previewRef.current) return;

        try {
          // Find the SVG element in the preview
          const svgElement = previewRef.current.querySelector("svg");
          if (!svgElement) {
            alert("No diagram to export");
            return;
          }

          // Get the SVG source
          const svgSource = new XMLSerializer().serializeToString(svgElement);

          // Use Tauri file dialog to choose save location
          const success = await api.exportSvg(
            svgSource,
            `${name || "diagram"}.svg`,
          );

          if (success) {
            console.log("SVG exported successfully");
          }
        } catch (error) {
          console.error("Export failed:", error);
          alert("Failed to export diagram as SVG");
        }
      },
    }));

    // Define custom theme before Monaco editor mounts
    const handleEditorBeforeMount = (monaco: any) => {
      // Define custom dark blue theme matching the app UI
      monaco.editor.defineTheme('midnight-blue', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'keyword', foreground: '93c5fd' },
          { token: 'string', foreground: 'a5d6a7' },
          { token: 'number', foreground: 'f9a825' },
          { token: 'type', foreground: '4dd0e1' },
        ],
        colors: {
          'editor.background': '#0f172a',
          'editor.foreground': '#e2e8f0',
          'editor.lineHighlightBackground': '#1e293b',
          'editor.selectionBackground': '#334155',
          'editorCursor.foreground': '#60a5fa',
          'editorLineNumber.foreground': '#64748b',
          'editorLineNumber.activeForeground': '#94a3b8',
          'editor.inactiveSelectionBackground': '#1e293b',
          'editorIndentGuide.background': '#334155',
          'editorWhitespace.foreground': '#334155',
          'scrollbarSlider.background': '#334155',
          'scrollbarSlider.hoverBackground': '#475569',
          'scrollbarSlider.activeBackground': '#64748b',
        }
      });
    };

    // Handle Monaco Editor mount
    const handleEditorMount = (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      // Register Mermaid language with Monaco Editor
      registerMermaidLanguage(monaco);
    };

    // Explicitly set theme when it changes
    useEffect(() => {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(theme === 'dark' ? 'midnight-blue' : 'vs');
      }
    }, [theme]);

    // Trigger layout refresh when zoom level changes
    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, [zoomLevel]);

    return (
      <div className="h-full overflow-hidden">
        <ResizableSplit
          left={
            <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
              <Editor
                height="100%"
                language="mermaid"
                theme={theme === 'dark' ? 'midnight-blue' : 'vs'}
                value={content}
                onChange={(value) => onContentChange(value || "")}
                beforeMount={handleEditorBeforeMount}
                onMount={handleEditorMount}
                options={{
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "off",
                  scrollbar: {
                    vertical: "auto",
                    horizontal: "auto",
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    alwaysConsumeMouseWheel: false,
                  },
                  overviewRulerLanes: 0,
                  lineDecorationsWidth: 10,
                  scrollBeyondLastColumn: 5,
                }}
              />
            </div>
          }
          right={
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-1 overflow-auto">
                <DiagramPreview
                  content={content}
                  zoomLevel={zoomLevel}
                  ref={previewRef}
                />
              </div>
            </div>
          }
          initialLeftWidth={50}
        />
      </div>
    );
  }
);

export default DiagramEditor;
