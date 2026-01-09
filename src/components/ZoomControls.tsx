import { useState, useRef, useEffect } from "react";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExportSvg?: () => void;
  onExportMmd?: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export default function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExportSvg,
  onExportMmd,
  minZoom = 0.3,
  maxZoom = 3.0,
}: ZoomControlsProps) {
  const zoomPercentage = Math.round(zoomLevel * 100);
  const canZoomIn = zoomLevel < maxZoom;
  const canZoomOut = zoomLevel > minZoom;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  return (
    <div className="flex items-center gap-2">
      <button
        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        −
      </button>

      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium">
        <span className="text-gray-700 dark:text-gray-200">
          {zoomPercentage}%
        </span>
      </div>

      <button
        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom In"
        aria-label="Zoom In"
      >
        +
      </button>

      <button
        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        onClick={onResetZoom}
        title="Reset Zoom to 100%"
        aria-label="Reset Zoom"
      >
        100%
      </button>

      {(onExportSvg || onExportMmd) && (
        <div className="relative" ref={menuRef}>
          <button
            className="px-3 py-1.5 bg-blue-500 dark:bg-blue-600 text-white rounded flex items-center justify-center gap-1.5 text-sm font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Diagram"
            aria-label="Export Diagram"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Export As
              </div>
              {onExportSvg && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportSvg();
                  }}
                >
                  🖼️ SVG Image (.svg)
                </button>
              )}
              {onExportMmd && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportMmd();
                  }}
                >
                  📝 Mermaid Source (.mmd)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
