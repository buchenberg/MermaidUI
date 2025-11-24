import { useEffect, useRef, useState, useCallback } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

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

  // Mouse event handlers for drag scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!previewRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - previewRef.current.offsetLeft);
    setStartY(e.pageY - previewRef.current.offsetTop);
    setScrollLeft(previewRef.current.scrollLeft);
    setScrollTop(previewRef.current.scrollTop);

    // Prevent text selection while dragging
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !previewRef.current) return;

      const x = e.pageX - previewRef.current.offsetLeft;
      const y = e.pageY - previewRef.current.offsetTop;
      const walkX = (x - startX) * 2; // Multiply for faster scrolling
      const walkY = (y - startY) * 2;

      previewRef.current.scrollLeft = scrollLeft - walkX;
      previewRef.current.scrollTop = scrollTop - walkY;
    },
    [isDragging, startX, startY, scrollLeft, scrollTop],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Change cursor to grabbing
      if (previewRef.current) {
        previewRef.current.style.cursor = "grabbing";
      }
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // Reset cursor
      if (previewRef.current) {
        previewRef.current.style.cursor = "grab";
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={previewRef}
      className="mermaid-preview"
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    />
  );
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

    // Clear any previous container sizing to allow natural scrolling
    container.style.width = "";
    container.style.height = "";
    container.style.minWidth = "";
    container.style.minHeight = "";

    // For large diagrams, let the natural scroll behavior work
    // The container will scroll naturally without explicit sizing
  }
}
