import { useState, useEffect } from "react";
import CollectionsBrowser from "./components/CollectionsBrowser";
import DiagramEditor from "./components/DiagramEditor";
import * as api from "./api";
import type { Collection, Diagram } from "./api";

// Re-export types for components that import from App.tsx
export type { Collection, Diagram };

function App() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

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

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`flex flex-col bg-gray-100 border-r border-gray-300 transition-all duration-300 ${sidebarCollapsed ? "w-12" : "w-80"}`}
      >
        <button
          className="w-12 h-12 border-none bg-gray-100 border-b border-gray-300 cursor-pointer text-gray-600 flex items-center justify-center flex-shrink-0 transition-colors duration-200 hover:bg-gray-200 active:bg-gray-300"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
        <div className={sidebarCollapsed ? "hidden" : ""}>
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
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {selectedDiagram ? (
          <DiagramEditor
            diagram={selectedDiagram}
            onUpdate={handleDiagramUpdate}
            onSave={handleDiagramUpdate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <h1 className="mb-4 text-gray-800">Welcome to MermaidUI</h1>
            <p>
              Select a collection from the sidebar to view diagrams, or create a
              new diagram.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
