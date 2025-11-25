import { useState, useEffect } from "react";
import { Collection, Diagram } from "../App";
import * as api from "../api";
import ConfirmModal from "./ConfirmModal";

interface CollectionsBrowserProps {
  collections: Collection[];
  selectedCollection: Collection | null;
  onCollectionSelect: (collection: Collection) => void;
  onCollectionCreate: (
    name: string,
    description?: string,
  ) => Promise<Collection>;
  onCollectionDelete: (collectionId: number) => Promise<void>;
  selectedDiagram: Diagram | null;
  onDiagramSelect: (diagram: Diagram) => void;
  onDiagramCreate?: (
    collectionId: number,
    name: string,
    content: string,
  ) => Promise<Diagram>;
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
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deleteCollectionId, setDeleteCollectionId] = useState<number | null>(
    null,
  );
  const [deleteDiagramId, setDeleteDiagramId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCollection) {
      fetchDiagrams(selectedCollection.id);
    }
  }, [selectedCollection]);

  // Update diagram in list when selectedDiagram changes (e.g., after save)
  useEffect(() => {
    if (selectedDiagram) {
      setDiagrams((prevDiagrams) =>
        prevDiagrams.map((diagram) =>
          diagram.id === selectedDiagram.id ? selectedDiagram : diagram,
        ),
      );
    }
  }, [selectedDiagram]);

  const fetchDiagrams = async (collectionId: number) => {
    try {
      const data = await api.getDiagramsByCollection(collectionId);
      setDiagrams(data);
    } catch (error) {
      console.error("Failed to fetch diagrams:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedCollection) return;

    const file = e.target.files[0];
    if (!file.name.match(/\.(mmd|mermaid)$/i)) {
      alert("Please upload a .mmd or .mermaid file");
      return;
    }

    setIsUploading(true);
    try {
      const content = await file.text();
      const name = file.name.replace(/\.(mmd|mermaid)$/i, "");

      const newDiagram = await api.createDiagram(
        selectedCollection.id,
        name,
        content,
      );
      await fetchDiagrams(selectedCollection.id);
      onDiagramSelect(newDiagram);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await onCollectionCreate(newCollectionName, newCollectionDesc);
      setShowNewCollection(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
    } catch (error) {
      alert("Failed to create collection");
    }
  };

  const handleCreateDiagram = async () => {
    if (!selectedCollection || !onDiagramCreate) return;
    const name = `New Diagram ${diagrams.length + 1}`;
    const content = `graph TD
    A[Start] --> B[Process]
    B --> C[End]`;
    try {
      const newDiagram = await onDiagramCreate(
        selectedCollection.id,
        name,
        content,
      );
      await fetchDiagrams(selectedCollection.id);
      onDiagramSelect(newDiagram);
    } catch (error) {
      alert("Failed to create diagram");
    }
  };

  const handleDeleteCollection = async () => {
    if (deleteCollectionId === null) return;
    try {
      await onCollectionDelete(deleteCollectionId);
      setDeleteCollectionId(null);
    } catch (error) {
      alert("Failed to delete collection");
    }
  };

  const handleDeleteDiagram = async () => {
    if (deleteDiagramId === null || !selectedCollection) return;
    try {
      await onDiagramDelete(deleteDiagramId);
      await fetchDiagrams(selectedCollection.id);
      setDeleteDiagramId(null);
    } catch (error) {
      alert("Failed to delete diagram");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ConfirmModal
        isOpen={deleteCollectionId !== null}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collections.find((c) => c.id === deleteCollectionId)?.name}"? This will also delete all diagrams in this collection. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteCollectionId(null)}
      />
      <ConfirmModal
        isOpen={deleteDiagramId !== null}
        title="Delete Diagram"
        message={`Are you sure you want to delete "${diagrams.find((d) => d.id === deleteDiagramId)?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteDiagram}
        onCancel={() => setDeleteDiagramId(null)}
      />
      <div className="flex justify-between items-center p-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800">Collections</h2>
        <button
          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-blue-600 transition-colors"
          onClick={() => setShowNewCollection(!showNewCollection)}
        >
          +
        </button>
      </div>

      {showNewCollection && (
        <div className="p-4 border-b border-gray-300 bg-white">
          <input
            type="text"
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <textarea
            placeholder="Description (optional)"
            value={newCollectionDesc}
            onChange={(e) => setNewCollectionDesc(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2 resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateCollection}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewCollection(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer transition-colors ${
              selectedCollection?.id === collection.id
                ? "bg-blue-50 border-blue-200"
                : "hover:bg-gray-50"
            }`}
          >
            <div
              className="flex-1 min-w-0"
              onClick={() => onCollectionSelect(collection)}
            >
              <div className="font-medium text-gray-900 truncate">
                {collection.name}
              </div>
              {collection.description && (
                <div className="text-sm text-gray-600 truncate mt-1">
                  {collection.description}
                </div>
              )}
            </div>
            <button
              className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center ml-2"
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
        <div className="border-t border-gray-300">
          <div className="flex justify-between items-center p-4 border-b border-gray-300">
            <h3 className="font-medium text-gray-800">Diagrams</h3>
            <div className="flex gap-2">
              {onDiagramCreate && (
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  onClick={handleCreateDiagram}
                >
                  New
                </button>
              )}
              <label
                className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
                  isUploading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isUploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept=".mmd,.mermaid"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={`flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer transition-colors ${
                  selectedDiagram?.id === diagram.id
                    ? "bg-blue-50 border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="flex-1 truncate"
                  onClick={() => onDiagramSelect(diagram)}
                >
                  {diagram.name}
                </div>
                <button
                  className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center ml-2"
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
              <div className="p-4 text-center text-gray-500">
                No diagrams in this collection
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
