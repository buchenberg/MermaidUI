import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import mermaid from "mermaid";
import { useTheme } from "../ThemeContext";

interface DiagramPreviewProps {
  content: string;
  zoomLevel?: number;
}

const DiagramPreview = forwardRef<HTMLDivElement, DiagramPreviewProps>(
  function DiagramPreview({ content, zoomLevel = 1.0 }, ref) {
    const previewRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, previewRef);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const { theme } = useTheme();

    useEffect(() => {
      if (!previewRef.current || !content.trim()) return;

      const renderDiagram = async () => {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: theme === 'dark' ? 'dark' : 'default',
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
            <div class="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
              <h3 class="font-semibold mb-2">Error rendering diagram</h3>
              <pre class="text-sm whitespace-pre-wrap">${error.message}</pre>
            </div>
          `;
          }
        }
      };

      renderDiagram();
    }, [content, theme]);

    // Apply zoom when zoomLevel changes
    useEffect(() => {
      if (previewRef.current) {
        applyZoomToPreview(previewRef.current, zoomLevel);
        // Force scrollbar recalculation by triggering a reflow
        const container = previewRef.current;
        const originalOverflow = container.style.overflow;
        container.style.overflow = "hidden";
        // Force reflow
        void container.offsetHeight;
        container.style.overflow = originalOverflow;
      }
    }, [zoomLevel]);

    // Mouse event handlers for drag scrolling
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (!previewRef.current) return;

      setIsDragging(true);
      setStartX(e.pageX);
      setStartY(e.pageY);
      setScrollLeft(previewRef.current.scrollLeft);
      setScrollTop(previewRef.current.scrollTop);

      // Prevent text selection while dragging
      e.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging || !previewRef.current) return;

        const walkX = (e.pageX - startX) * 2; // Multiply for faster scrolling
        const walkY = (e.pageY - startY) * 2;

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
        ref={combinedRef}
        className="w-full h-full overflow-auto bg-white dark:bg-gray-900"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {!content.trim() ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Enter Mermaid diagram code in the editor to see the preview</p>
          </div>
        ) : (
          /* Content will be rendered here by mermaid into the div */
          null
        )}
      </div>
    );
  },
);

// Helper function to combine forwarded ref with internal ref
function useCombinedRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (element: T) => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(element);
      } else {
        (ref as React.MutableRefObject<T | null>).current = element;
      }
    });
  };
}

export default DiagramPreview;

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
