import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import "./DiagramPreview.css";

interface DiagramPreviewProps {
  content: string;
  zoomLevel?: number;
}

export default function DiagramPreview({
  content,
  zoomLevel = 1.0,
}: DiagramPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current || !content.trim()) return;

    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, content);

        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
          // Apply zoom to the rendered SVG
          applyZoomToPreview(previewRef.current, zoomLevel);
        }
      } catch (error: any) {
        if (previewRef.current) {
          previewRef.current.innerHTML = `
            <div class="error-message">
              <h3>Error rendering diagram</h3>
              <pre>${error.message}</pre>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="preview-empty">
        <p>Enter Mermaid diagram code in the editor to see the preview</p>
      </div>
    );
  }

  // Apply zoom when zoomLevel changes
  useEffect(() => {
    if (previewRef.current) {
      applyZoomToPreview(previewRef.current, zoomLevel);
    }
  }, [zoomLevel]);

  return <div ref={previewRef} className="mermaid-preview" />;
}

// Helper function to apply zoom transform to the preview container
function applyZoomToPreview(container: HTMLDivElement, zoomLevel: number) {
  // Find the SVG element inside the container
  const svg = container.querySelector("svg");
  if (svg) {
    // Apply transform to the SVG
    svg.style.transform = `scale(${zoomLevel})`;
    svg.style.transformOrigin = "0 0";
    svg.style.transition = "transform 0.2s ease";

    // Update container size to accommodate zoomed content
    const originalWidth = svg.getAttribute("width");
    const originalHeight = svg.getAttribute("height");

    if (originalWidth && originalHeight) {
      const scaledWidth = parseFloat(originalWidth) * zoomLevel;
      const scaledHeight = parseFloat(originalHeight) * zoomLevel;
      container.style.width = `${scaledWidth}px`;
      container.style.height = `${scaledHeight}px`;
      container.style.minWidth = `${scaledWidth}px`;
      container.style.minHeight = `${scaledHeight}px`;
    }
  }
}
