import { useState, useEffect, useRef } from "react";
import CollectionsBrowser from "./components/CollectionsBrowser";
import DiagramEditor, { DiagramEditorRef } from "./components/DiagramEditor";
import ThemeToggle from "./components/ThemeToggle";
import ZoomControls from "./components/ZoomControls";
import { useTheme } from "./ThemeContext";
import * as api from "./api";
import type { Collection, Diagram } from "./api";

// Re-export types for components that import from App.tsx
export type { Collection, Diagram };

function App() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Editor State (Lifted)
  const [diagramName, setDiagramName] = useState("");
  const [diagramContent, setDiagramContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [hasNameChanges, setHasNameChanges] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const saved = localStorage.getItem("mermaid-ui-auto-save");
    return saved ? saved === "true" : false;
  });

  const editorRef = useRef<DiagramEditorRef>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  // Sync diagram state when selected diagram changes
  useEffect(() => {
    if (selectedDiagram) {
      setDiagramName(selectedDiagram.name);
      setDiagramContent(selectedDiagram.content);
      setHasChanges(false);
      setHasNameChanges(false);
    }
  }, [selectedDiagram]);

  // Sidebar resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Snap to collapse if dragged too far left (Threshold 240px)
      if (newWidth < 240) {
        setSidebarCollapsed(true);
        setIsDraggingSidebar(false);
        return;
      }

      // Constrain width to ensure content remains visible (min 300px)
      setSidebarWidth(Math.max(300, Math.min(500, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    if (isDraggingSidebar) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const fetchCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
      if (data.length > 0 && !selectedCollection) {
        setSelectedCollection(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setSelectedDiagram(null);
  };

  const handleDiagramSelect = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
  };

  const handleDiagramCreate = async (
    collectionId: number,
    name: string,
    content: string,
  ) => {
    try {
      const newDiagram = await api.createDiagram(collectionId, name, content);
      setSelectedDiagram(newDiagram);
      return newDiagram;
    } catch (error) {
      console.error("Failed to create diagram:", error);
      throw error;
    }
  };

  const handleDiagramUpdate = async (
    diagramId: number,
    name: string,
    content: string,
  ) => {
    try {
      const updatedDiagram = await api.updateDiagram(diagramId, name, content);
      setSelectedDiagram(updatedDiagram);
      return updatedDiagram;
    } catch (error) {
      console.error("Failed to update diagram:", error);
      throw error;
    }
  };

  const handleCollectionCreate = async (name: string, description?: string) => {
    try {
      const newCollection = await api.createCollection(name, description);
      setCollections([...collections, newCollection]);
      setSelectedCollection(newCollection);
      return newCollection;
    } catch (error) {
      console.error("Failed to create collection:", error);
      throw error;
    }
  };

  const handleCollectionDelete = async (collectionId: number) => {
    try {
      const success = await api.deleteCollection(collectionId);
      if (success) {
        const updatedCollections = collections.filter(
          (c) => c.id !== collectionId,
        );
        setCollections(updatedCollections);
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(
            updatedCollections.length > 0 ? updatedCollections[0] : null,
          );
          setSelectedDiagram(null);
        }
      } else {
        alert("Failed to delete collection");
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection");
    }
  };

  const handleDiagramDelete = async (diagramId: number) => {
    try {
      const success = await api.deleteDiagram(diagramId);
      if (success) {
        if (selectedDiagram?.id === diagramId) {
          setSelectedDiagram(null);
        }
      } else {
        alert("Failed to delete diagram");
      }
    } catch (error) {
      console.error("Failed to delete diagram:", error);
      alert("Failed to delete diagram");
    }
  };

  // Header control handlers
  const handleNameChange = (newName: string) => {
    setDiagramName(newName);
    setHasNameChanges(true);
    setHasChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setDiagramContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedDiagram) return;
    try {
      await handleDiagramUpdate(selectedDiagram.id, diagramName, diagramContent);
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

  // Auto-save effect
  useEffect(() => {
    if (!selectedDiagram || !hasChanges || !autoSaveEnabled) return;
    const contentChanged = diagramContent !== selectedDiagram.content;
    if (!contentChanged) return;

    const timer = setTimeout(async () => {
      try {
        await handleDiagramUpdate(selectedDiagram.id, selectedDiagram.name, diagramContent);
        if (!hasNameChanges) {
          setHasChanges(false);
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [diagramContent, hasChanges, autoSaveEnabled, selectedDiagram?.id]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setZoomLevel(1.0);

  // Export handlers
  const handleExportMmd = async () => {
    try {
      const success = await api.exportMermaidSource(
        diagramContent,
        `${diagramName || "diagram"}.mmd`,
      );
      if (success) {
        console.log("Mermaid source exported successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export Mermaid source");
    }
  };

  const handleExportSvg = () => {
    editorRef.current?.exportSvg(diagramName);
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Unified Header */}
      <div className={`flex items-center gap-4 px-4 py-2 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
        {/* Hamburger Menu */}
        <button
          className={`w-10 h-10 border-none rounded cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => {
            if (sidebarCollapsed) setSidebarWidth(320);
            setSidebarCollapsed(!sidebarCollapsed);
          }}
          title={sidebarCollapsed ? "Show navigation" : "Hide navigation"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Diagram Name Input */}
        {selectedDiagram ? (
          <>
            <input
              type="text"
              className={`flex-1 p-2 border rounded text-base font-medium ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              value={diagramName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Diagram name"
            />

            {/* Auto-save checkbox */}
            <label className={`flex items-center gap-2 cursor-pointer text-sm select-none whitespace-nowrap ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}>
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                className="cursor-pointer w-4 h-4"
              />
              <span>Auto-save</span>
            </label>

            {/* Unsaved indicator */}
            {hasChanges && (
              <span className="text-orange-500 text-sm whitespace-nowrap">
                Unsaved changes
              </span>
            )}

            {/* Save button */}
            <button
              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>

            {/* Divider */}
            <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />

            {/* Zoom Controls (with Exports) */}
            <ZoomControls
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onExportSvg={handleExportSvg}
              onExportMmd={handleExportMmd}
            />
          </>
        ) : (
          <div className="flex-1" />
        )}

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div ref={containerRef} className={`flex flex-1 min-h-0 overflow-hidden ${isDraggingSidebar ? 'select-none' : ''}`}>
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <>
            <div
              style={{ width: sidebarWidth }}
              className={`flex-shrink-0 overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <CollectionsBrowser
                collections={collections}
                selectedCollection={selectedCollection}
                onCollectionSelect={handleCollectionSelect}
                onCollectionCreate={handleCollectionCreate}
                onCollectionDelete={handleCollectionDelete}
                selectedDiagram={selectedDiagram}
                onDiagramSelect={handleDiagramSelect}
                onDiagramCreate={handleDiagramCreate}
                onDiagramDelete={handleDiagramDelete}
              />
            </div>
            {/* Thin resize divider */}
            <div
              className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${isDraggingSidebar
                ? 'bg-blue-500'
                : theme === 'dark'
                  ? 'bg-gray-700 hover:bg-blue-500'
                  : 'bg-gray-300 hover:bg-blue-400'
                }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSidebar(true);
              }}
            />
          </>
        )}

        {/* Editor/Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-gray-900">
          {selectedDiagram ? (
            <DiagramEditor
              ref={editorRef}
              content={diagramContent}
              onContentChange={handleContentChange}
              zoomLevel={zoomLevel}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <h1 className="mb-4 text-gray-800 dark:text-gray-200">Welcome to MermaidUI</h1>
              <p>
                Select a collection from the sidebar to view diagrams, or create a
                new diagram.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
