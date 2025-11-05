import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import DiagramPreview from './DiagramPreview';
import ExportMenu from './ExportMenu';
import ResizableSplit from './ResizableSplit';
import { Diagram } from '../App';
import './DiagramEditor.css';

interface DiagramEditorProps {
  diagram: Diagram;
  onUpdate: (id: number, name: string, content: string) => Promise<Diagram>;
  onSave: (id: number, name: string, content: string) => Promise<Diagram>;
}

export default function DiagramEditor({ diagram, onUpdate, onSave }: DiagramEditorProps) {
  const [name, setName] = useState(diagram.name);
  const [content, setContent] = useState(diagram.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasNameChanges, setHasNameChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Load auto-save preference from localStorage, default to false
    const saved = localStorage.getItem('mermaid-ui-auto-save');
    return saved ? saved === 'true' : false;
  });
  const editorRef = useRef<{ editor: any } | null>(null);

  useEffect(() => {
    setName(diagram.name);
    setContent(diagram.content);
    setHasChanges(false);
    setHasNameChanges(false);
  }, [diagram.id]);

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
      alert('Failed to save diagram');
    }
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem('mermaid-ui-auto-save', enabled.toString());
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
      console.error('Auto-save failed:', error);
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
  }, [content, hasChanges, autoSaveEnabled, diagram.id, diagram.name, diagram.content]);

  return (
    <div className="diagram-editor">
      <div className="editor-header">
        <input
          type="text"
          className="diagram-name-input"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Diagram name"
        />
        <div className="header-actions">
          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => handleAutoSaveToggle(e.target.checked)}
            />
            <span>Auto-save</span>
          </label>
          {hasChanges && <span className="unsaved-indicator">Unsaved changes</span>}
          <button className="btn-save" onClick={handleSave} disabled={!hasChanges}>
            Save
          </button>
          <ExportMenu 
            diagramId={diagram.id} 
            diagramName={diagram.name}
            hasUnsavedChanges={hasChanges}
            onSaveBeforeExport={handleSave}
          />
        </div>
      </div>
      <div className="editor-content">
        <ResizableSplit
          left={
            <div className="editor-pane">
              <CodeMirror
                value={content}
                height="100%"
                extensions={[markdown()]}
                theme={oneDark}
                onChange={(value) => handleContentChange(value)}
                placeholder="Enter your Mermaid diagram code here..."
              />
            </div>
          }
          right={
            <div className="preview-pane">
              <DiagramPreview content={content} />
            </div>
          }
          initialLeftWidth={50}
        />
      </div>
    </div>
  );
}
