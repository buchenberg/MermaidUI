import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import DiagramPreview from "./DiagramPreview";
import ResizableSplit from "./ResizableSplit";
import ZoomControls from "./ZoomControls";
import { Diagram } from "../App";
import * as api from "../api";
import registerMermaidLanguage from "monaco-mermaid";

interface DiagramEditorProps {
  diagram: Diagram;
  onUpdate: (id: number, name: string, content: string) => Promise<Diagram>;
  onSave: (id: number, name: string, content: string) => Promise<Diagram>;
}

export default function DiagramEditor({
  diagram,
  onUpdate,
  onSave,
}: DiagramEditorProps) {
  const [name, setName] = useState(diagram.name);
  const [content, setContent] = useState(diagram.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasNameChanges, setHasNameChanges] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const previewRef = useRef<HTMLDivElement>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Load auto-save preference from localStorage, default to false
    const saved = localStorage.getItem("mermaid-ui-auto-save");
    return saved ? saved === "true" : false;
  });

  const editorRef = useRef<any>(null);

  // Handle Monaco Editor mount
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Register Mermaid language with Monaco Editor
    registerMermaidLanguage(monaco);
  };

  // Trigger layout refresh when zoom level changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [zoomLevel]);

  useEffect(() => {
    setName(diagram.name);
    setContent(diagram.content);
    setHasChanges(false);
    setHasNameChanges(false);
  }, [diagram.id]);

  // Zoom control handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  const handleExportSvg = async () => {
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
        // Optional: Show success message
        console.log("SVG exported successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export diagram as SVG");
    }
  };

  const handleExportMmd = async () => {
    try {
      // Use Tauri file dialog to choose save location for Mermaid source
      const success = await api.exportMermaidSource(
        content,
        `${name || "diagram"}.mmd`,
      );

      if (success) {
        // Optional: Show success message
        console.log("Mermaid source exported successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export Mermaid source");
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    setHasNameChanges(true);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onSave(diagram.id, name, content);
      setHasChanges(false);
      setHasNameChanges(false);
    } catch (error) {
      alert("Failed to save diagram");
    }
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem("mermaid-ui-auto-save", enabled.toString());
  };

  const handleAutoSave = async () => {
    // Auto-save content only (name changes require manual save)
    // Use the original diagram name for auto-save since name changes aren't auto-saved
    try {
      await onUpdate(diagram.id, diagram.name, content);
      // Only clear hasChanges if there are no name changes
      if (!hasNameChanges) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  // Auto-save content changes only (not name) after 2 seconds of inactivity
  // Only if auto-save is enabled
  useEffect(() => {
    if (!hasChanges || !autoSaveEnabled) return;
    // Only auto-save if content has changed (not just name)
    const contentChanged = content !== diagram.content;
    if (!contentChanged) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    content,
    hasChanges,
    autoSaveEnabled,
    diagram.id,
    diagram.name,
    diagram.content,
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        <ResizableSplit
          left={
            <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-white flex-shrink-0">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded text-base font-medium mr-4 max-w-xs"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Diagram name"
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none hover:text-gray-800">
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span>Auto-save</span>
                  </label>
                  {hasChanges && (
                    <span className="text-orange-500 text-sm">
                      Unsaved changes
                    </span>
                  )}
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={!hasChanges}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language="mermaid"
                  theme="vs-dark"
                  value={content}
                  onChange={(value) => handleContentChange(value || "")}
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
            </div>
          }
          right={
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex justify-end items-center p-4 border-b border-gray-300 bg-gray-50 flex-shrink-0">
                <ZoomControls
                  zoomLevel={zoomLevel}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                  onExportSvg={handleExportSvg}
                  onExportMmd={handleExportMmd}
                />
              </div>
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
    </div>
  );
}
