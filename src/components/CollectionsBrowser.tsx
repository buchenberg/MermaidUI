import { useState, useEffect } from 'react';
import { Collection, Diagram } from '../App';
import * as api from '../api';
import ConfirmModal from './ConfirmModal';
import './CollectionsBrowser.css';

interface CollectionsBrowserProps {
  collections: Collection[];
  selectedCollection: Collection | null;
  onCollectionSelect: (collection: Collection) => void;
  onCollectionCreate: (name: string, description?: string) => Promise<Collection>;
  onCollectionDelete: (collectionId: number) => Promise<void>;
  selectedDiagram: Diagram | null;
  onDiagramSelect: (diagram: Diagram) => void;
  onDiagramCreate?: (collectionId: number, name: string, content: string) => Promise<Diagram>;
  onDiagramDelete: (diagramId: number) => Promise<void>;
}

export default function CollectionsBrowser({
  collections,
  selectedCollection,
  onCollectionSelect,
  onCollectionCreate,
  onCollectionDelete,
  selectedDiagram,
  onDiagramSelect,
  onDiagramCreate,
  onDiagramDelete,
}: CollectionsBrowserProps) {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteCollectionId, setDeleteCollectionId] = useState<number | null>(null);
  const [deleteDiagramId, setDeleteDiagramId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCollection) {
      fetchDiagrams(selectedCollection.id);
    }
  }, [selectedCollection]);

  // Update diagram in list when selectedDiagram changes (e.g., after save)
  useEffect(() => {
    if (selectedDiagram) {
      setDiagrams(prevDiagrams => 
        prevDiagrams.map(diagram => 
          diagram.id === selectedDiagram.id ? selectedDiagram : diagram
        )
      );
    }
  }, [selectedDiagram]);

  const fetchDiagrams = async (collectionId: number) => {
    try {
      const data = await api.getDiagramsByCollection(collectionId);
      setDiagrams(data);
    } catch (error) {
      console.error('Failed to fetch diagrams:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedCollection) return;
    
    const file = e.target.files[0];
    if (!file.name.match(/\.(mmd|mermaid)$/i)) {
      alert('Please upload a .mmd or .mermaid file');
      return;
    }

    setIsUploading(true);
    try {
      const content = await file.text();
      const name = file.name.replace(/\.(mmd|mermaid)$/i, '');
      
      const newDiagram = await api.createDiagram(selectedCollection.id, name, content);
      await fetchDiagrams(selectedCollection.id);
      onDiagramSelect(newDiagram);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await onCollectionCreate(newCollectionName, newCollectionDesc);
      setShowNewCollection(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
    } catch (error) {
      alert('Failed to create collection');
    }
  };

  const handleCreateDiagram = async () => {
    if (!selectedCollection || !onDiagramCreate) return;
    const name = `New Diagram ${diagrams.length + 1}`;
    const content = `graph TD
    A[Start] --> B[Process]
    B --> C[End]`;
    try {
      const newDiagram = await onDiagramCreate(selectedCollection.id, name, content);
      await fetchDiagrams(selectedCollection.id);
      onDiagramSelect(newDiagram);
    } catch (error) {
      alert('Failed to create diagram');
    }
  };

  const handleDeleteCollection = async () => {
    if (deleteCollectionId === null) return;
    try {
      await onCollectionDelete(deleteCollectionId);
      setDeleteCollectionId(null);
    } catch (error) {
      alert('Failed to delete collection');
    }
  };

  const handleDeleteDiagram = async () => {
    if (deleteDiagramId === null || !selectedCollection) return;
    try {
      await onDiagramDelete(deleteDiagramId);
      await fetchDiagrams(selectedCollection.id);
      setDeleteDiagramId(null);
    } catch (error) {
      alert('Failed to delete diagram');
    }
  };

  return (
    <div className="collections-browser">
      <ConfirmModal
        isOpen={deleteCollectionId !== null}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collections.find(c => c.id === deleteCollectionId)?.name}"? This will also delete all diagrams in this collection. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteCollectionId(null)}
      />
      <ConfirmModal
        isOpen={deleteDiagramId !== null}
        title="Delete Diagram"
        message={`Are you sure you want to delete "${diagrams.find(d => d.id === deleteDiagramId)?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteDiagram}
        onCancel={() => setDeleteDiagramId(null)}
      />
      <div className="collections-header">
        <h2>Collections</h2>
        <button
          className="btn-new"
          onClick={() => setShowNewCollection(!showNewCollection)}
        >
          +
        </button>
      </div>

      {showNewCollection && (
        <div className="new-collection-form">
          <input
            type="text"
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
          />
          <textarea
            placeholder="Description (optional)"
            value={newCollectionDesc}
            onChange={(e) => setNewCollectionDesc(e.target.value)}
          />
          <div className="form-actions">
            <button onClick={handleCreateCollection}>Create</button>
            <button onClick={() => setShowNewCollection(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="collections-list">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`collection-item ${selectedCollection?.id === collection.id ? 'active' : ''}`}
          >
            <div className="collection-item-content" onClick={() => onCollectionSelect(collection)}>
              <div className="collection-name">{collection.name}</div>
              {collection.description && (
                <div className="collection-desc">{collection.description}</div>
              )}
            </div>
            <button
              className="btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteCollectionId(collection.id);
              }}
              title="Delete collection"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {selectedCollection && (
        <div className="diagrams-section">
          <div className="diagrams-header">
            <h3>Diagrams</h3>
            <div className="diagram-actions">
              {onDiagramCreate && (
                <button className="btn-new-diagram" onClick={handleCreateDiagram}>
                  New
                </button>
              )}
              <label className="upload-btn">
                {isUploading ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  accept=".mmd,.mermaid"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          <div className="diagrams-list">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={`diagram-item ${selectedDiagram?.id === diagram.id ? 'active' : ''}`}
              >
                <div className="diagram-item-content" onClick={() => onDiagramSelect(diagram)}>
                  {diagram.name}
                </div>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDiagramId(diagram.id);
                  }}
                  title="Delete diagram"
                >
                  ×
                </button>
              </div>
            ))}
            {diagrams.length === 0 && (
              <div className="empty-state">No diagrams in this collection</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

