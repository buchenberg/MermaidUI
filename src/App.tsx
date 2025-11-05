import { useState, useEffect } from 'react';
import CollectionsBrowser from './components/CollectionsBrowser';
import DiagramEditor from './components/DiagramEditor';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Diagram {
  id: number;
  collection_id: number;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function App() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${API_BASE}/collections`);
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
          if (data.length > 0 && !selectedCollection) {
            setSelectedCollection(data[0]);
          }
          return;
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('Failed to fetch collections after retries:', error);
        } else {
          console.log(`Retrying connection to backend... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setSelectedDiagram(null);
  };

  const handleDiagramSelect = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
  };

  const handleDiagramCreate = async (collectionId: number, name: string, content: string) => {
    try {
      const response = await fetch(`${API_BASE}/diagrams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection_id: collectionId, name, content }),
      });
      const newDiagram = await response.json();
      setSelectedDiagram(newDiagram);
      return newDiagram;
    } catch (error) {
      console.error('Failed to create diagram:', error);
      throw error;
    }
  };

  const handleDiagramUpdate = async (diagramId: number, name: string, content: string) => {
    try {
      const response = await fetch(`${API_BASE}/diagrams/${diagramId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      const updatedDiagram = await response.json();
      setSelectedDiagram(updatedDiagram);
      return updatedDiagram;
    } catch (error) {
      console.error('Failed to update diagram:', error);
      throw error;
    }
  };

  const handleCollectionCreate = async (name: string, description?: string) => {
    try {
      const response = await fetch(`${API_BASE}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const newCollection = await response.json();
      setCollections([...collections, newCollection]);
      setSelectedCollection(newCollection);
      return newCollection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  };

  const handleCollectionDelete = async (collectionId: number) => {
    try {
      const response = await fetch(`${API_BASE}/collections/${collectionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedCollections = collections.filter(c => c.id !== collectionId);
        setCollections(updatedCollections);
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(updatedCollections.length > 0 ? updatedCollections[0] : null);
          setSelectedDiagram(null);
        }
      } else {
        alert('Failed to delete collection');
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    }
  };

  const handleDiagramDelete = async (diagramId: number) => {
    try {
      const response = await fetch(`${API_BASE}/diagrams/${diagramId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (selectedDiagram?.id === diagramId) {
          setSelectedDiagram(null);
        }
      } else {
        alert('Failed to delete diagram');
      }
    } catch (error) {
      console.error('Failed to delete diagram:', error);
      alert('Failed to delete diagram');
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
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
      <div className="main-content">
        {selectedDiagram ? (
          <DiagramEditor
            diagram={selectedDiagram}
            onUpdate={handleDiagramUpdate}
            onSave={handleDiagramUpdate}
          />
        ) : (
          <div className="welcome">
            <h1>Welcome to MermaidUI</h1>
            <p>Select a collection from the sidebar to view diagrams, or create a new diagram.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

