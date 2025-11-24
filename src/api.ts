import { invoke } from "@tauri-apps/api/tauri";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";

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

// Collections API
export async function getCollections(): Promise<Collection[]> {
  return invoke<Collection[]>("get_collections");
}

export async function getCollection(id: number): Promise<Collection | null> {
  return invoke<Collection | null>("get_collection", { id });
}

export async function createCollection(
  name: string,
  description?: string,
): Promise<Collection> {
  return invoke<Collection>("create_collection", {
    name,
    description: description || null,
  });
}

export async function updateCollection(
  id: number,
  name: string,
  description?: string,
): Promise<Collection> {
  return invoke<Collection>("update_collection", {
    id,
    name,
    description: description || null,
  });
}

export async function deleteCollection(id: number): Promise<boolean> {
  return invoke<boolean>("delete_collection", { id });
}

// Diagrams API
export async function getDiagramsByCollection(
  collectionId: number,
): Promise<Diagram[]> {
  return invoke<Diagram[]>("get_diagrams_by_collection", { collectionId });
}

export async function getDiagram(id: number): Promise<Diagram | null> {
  return invoke<Diagram | null>("get_diagram", { id });
}

export async function createDiagram(
  collectionId: number,
  name: string,
  content: string,
): Promise<Diagram> {
  return invoke<Diagram>("create_diagram", { collectionId, name, content });
}

export async function updateDiagram(
  id: number,
  name: string,
  content: string,
): Promise<Diagram> {
  return invoke<Diagram>("update_diagram", { id, name, content });
}

export async function deleteDiagram(id: number): Promise<boolean> {
  return invoke<boolean>("delete_diagram", { id });
}

// SVG Export API
export async function exportSvg(
  svgContent: string,
  defaultName: string,
): Promise<boolean> {
  try {
    // Show save dialog
    const filePath = await save({
      defaultPath: defaultName,
      filters: [
        {
          name: "SVG Files",
          extensions: ["svg"],
        },
      ],
    });

    if (!filePath) {
      // User cancelled the dialog
      return false;
    }

    // Write the SVG content to the selected file
    await writeTextFile(filePath, svgContent);
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}
